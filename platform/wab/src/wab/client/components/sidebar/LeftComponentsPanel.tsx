// This is a skeleton starter React component generated by Plasmic.
// This file is owned by you, feel free to edit as you see fit.
import {
  Component,
  isKnownProjectDependency,
  ProjectDependency,
} from "@/wab/classes";
import { mkProjectLocation, openNewTab } from "@/wab/client/cli-routes";
import ListItem from "@/wab/client/components/ListItem";
import { MenuBuilder } from "@/wab/client/components/menu-builder";
import promptDeleteComponent from "@/wab/client/components/modals/componentDeletionModal";
import { DefaultComponentKindModal } from "@/wab/client/components/modals/DefaultComponentKindModal";
import {
  reactPrompt,
  showTemporaryPrompt,
} from "@/wab/client/components/quick-modals";
import { DraggableInsertable } from "@/wab/client/components/studio/add-drawer/DraggableInsertable";
import { Matcher } from "@/wab/client/components/view-common";
import { Icon } from "@/wab/client/components/widgets/Icon";
import { AddItemType } from "@/wab/client/definitions/insertables";
import ComponentIcon from "@/wab/client/plasmic/plasmic_kit/PlasmicIcon__Component";
import { PlasmicLeftComponentsPanel } from "@/wab/client/plasmic/plasmic_kit_left_pane/PlasmicLeftComponentsPanel";
import { StudioCtx, useStudioCtx } from "@/wab/client/studio-ctx/StudioCtx";
import { ViewCtx } from "@/wab/client/studio-ctx/view-ctx";
import { spawn } from "@/wab/common";
import {
  DefaultComponentKind,
  getComponentDisplayName,
  getDefaultComponentKind,
  getDefaultComponentLabel,
  getSuperComponents,
  isCodeComponent,
  isContextCodeComponent,
  isHostLessCodeComponent,
  isPageComponent,
  isReusableComponent,
  isShownHostLessCodeComponent,
  sortComponentsByName,
} from "@/wab/components";
import { MainBranchId } from "@/wab/shared/ApiSchema";
import { isMixedArena } from "@/wab/shared/Arenas";
import { FRAME_CAP } from "@/wab/shared/Labels";
import { isHostLessPackage } from "@/wab/sites";
import { Menu, Popover } from "antd";
import { orderBy } from "lodash";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { DraggableProvidedDragHandleProps } from "react-beautiful-dnd";
import { isBuiltinCodeComponent } from "src/wab/shared/code-components/builtin-code-components";
import { isCoreTeamEmail } from "src/wab/shared/devflag-utils";
import { useDepFilterButton } from "./left-panel-utils";
import { CodeComponentRow } from "./LeftCodeComponents";
import { ItemOrGroup, VirtualGroupedList } from "./VirtualGroupedList";

const LeftComponentsPanel = observer(function LeftComponentsPanel(props: {}) {
  const studioCtx = useStudioCtx();
  const [query, setQuery] = React.useState("");
  const { filterDeps, filterProps } = useDepFilterButton({
    studioCtx,
    deps: studioCtx.site.projectDependencies,
  });
  const matcher = new Matcher(query);
  const readOnly = studioCtx.getLeftTabPermission("components") === "readable";

  const isAdmin = isCoreTeamEmail(
    studioCtx.appCtx.selfInfo?.email,
    studioCtx.appCtx.appConfig
  );

  const plainComponents = studioCtx.site.components.filter(
    (c) => isReusableComponent(c) && !isCodeComponent(c)
  );

  const makeCompsItems = (comps: Component[]) => {
    comps = comps.filter(
      (comp) =>
        matcher.matches(getComponentDisplayName(comp)) &&
        isReusableComponent(comp) &&
        !isBuiltinCodeComponent(comp) &&
        !isContextCodeComponent(comp) &&
        (!isHostLessCodeComponent(comp) ||
          isShownHostLessCodeComponent(
            comp,
            studioCtx.appCtx.appConfig.hostLessComponents
          ))
    );
    comps = sortComponentsByName(comps);
    return comps.map((comp) => ({
      type: "item" as const,
      item: comp,
      key: comp.uuid,
    }));
  };

  const makeDepsItems = (deps: ProjectDependency[]) => {
    deps = deps.filter(
      (dep) => filterDeps.length === 0 || filterDeps.includes(dep)
    );
    deps = orderBy(deps, (dep) =>
      studioCtx.projectDependencyManager.getNiceDepName(dep)
    );
    return deps.map((dep) => ({
      type: "group" as const,
      group: dep,
      key: dep.uuid,
      // For deps, we only show code components from hostless packages; for non-hostless
      // packages, ony the code components from the current host page count, and they're
      // shown in the Code components section
      items: makeCompsItems(
        dep.site.components.filter(
          (c) =>
            isReusableComponent(c) &&
            (isHostLessPackage(dep.site) || !isCodeComponent(c))
        )
      ),
      defaultCollapsed: true,
    }));
  };

  const items: ItemOrGroup<ProjectDependency | string, Component>[] = [
    ...(filterDeps.length === 0
      ? [
          ...makeCompsItems(plainComponents),
          {
            type: "group" as const,
            group: "Code components",
            key: "code-components",
            items: makeCompsItems(
              studioCtx.site.components.filter((c) => isCodeComponent(c))
            ),
            defaultCollapsed: false,
          },
        ]
      : []),
    // Show non-hostless packages first, then hostless packages
    ...makeDepsItems(
      studioCtx.site.projectDependencies.filter(
        (d) => !isHostLessPackage(d.site)
      )
    ),
    ...makeDepsItems(
      studioCtx.site.projectDependencies.filter((d) =>
        isHostLessPackage(d.site)
      )
    ),
    ...(isAdmin
      ? studioCtx.site.projectDependencies
          .filter((d) => !isHostLessPackage(d.site))
          .map((dep) => ({
            type: "group" as const,
            group: `PAGES FROM ${dep.name} (DO NOT USE)`,
            key: dep.uuid,
            // For deps, we only show code components from hostless packages; for non-hostless
            // packages, ony the code components from the current host page count, and they're
            // shown in the Code components section
            items: dep.site.components
              .filter((c) => isPageComponent(c))
              .map((comp) => ({
                type: "item" as const,
                item: comp,
                key: comp.uuid,
              })),
            defaultCollapsed: true,
          }))
      : []),
  ];

  const onFindReferences = (comp: Component) => {
    spawn(
      studioCtx.changeUnsafe(() => (studioCtx.findReferencesComponent = comp))
    );
  };

  return (
    <PlasmicLeftComponentsPanel
      root={{
        props: {
          "data-test-id": "components-tab",
        } as any,
      }}
      leftSearchPanel={{
        searchboxProps: {
          value: query,
          onChange: (e) => setQuery(e.target.value),
          autoFocus: true,
        },
        filterProps,
      }}
      newComponentButton={
        readOnly
          ? { render: () => null }
          : {
              onClick: () => studioCtx.siteOps().createFrameForNewComponent(),
            }
      }
      content={
        <>
          <VirtualGroupedList
            items={items}
            renderItem={(comp, group) => (
              <ComponentRow
                studioCtx={studioCtx}
                readOnly={readOnly}
                dep={
                  group && isKnownProjectDependency(group.group)
                    ? group.group
                    : undefined
                }
                component={comp}
                isPlainComponent={plainComponents.includes(comp)}
                matcher={matcher}
                onFindReferences={() => onFindReferences(comp)}
                onDuplicate={
                  readOnly
                    ? undefined
                    : () => studioCtx.siteOps().tryDuplicatingComponent(comp)
                }
              />
            )}
            itemHeight={32}
            renderGroupHeader={(group) => {
              if (typeof group === "string") {
                return group;
              } else {
                return `Imported from "${studioCtx.projectDependencyManager.getNiceDepName(
                  group
                )}"`;
              }
            }}
            headerHeight={50}
            hideEmptyGroups
            forceExpandAll={matcher.hasQuery() || filterDeps.length > 0}
          />
        </>
      }
    />
  );
});

export function buildCommonComponentMenuItems(
  builder: MenuBuilder,
  studioCtx: StudioCtx,
  component: Component,
  onFindReferences: () => void
) {
  builder.genSection(undefined, (push) => {
    push(
      <Menu.Item key="references" onClick={onFindReferences}>
        <strong>Find</strong> all references
      </Menu.Item>
    );
    genComponentSwapMenuItem(builder, studioCtx, component);
  });

  builder.genSection(undefined, (push) => {
    push(
      <Menu.Item
        key="promote-default-kind"
        onClick={async () => {
          const kind = await showTemporaryPrompt<
            DefaultComponentKind | undefined
          >((onSubmit, onCancel) => (
            <DefaultComponentKindModal
              studioCtx={studioCtx}
              onSubmit={onSubmit}
              onCancel={onCancel}
            />
          ));
          if (kind) {
            spawn(
              studioCtx.change(({ success }) => {
                studioCtx
                  .siteOps()
                  .promoteComponentToDefaultKind(studioCtx, component, kind);
                return success();
              })
            );
          }
        }}
      >
        Set as <strong>default component category</strong>
      </Menu.Item>
    );
    push(
      <Menu.Item
        key="set-page-wrapper"
        onClick={async () => {
          await studioCtx.change(({ success, failure }) => {
            studioCtx.site.pageWrapper =
              studioCtx.site.pageWrapper === component ? undefined : component;
            return success();
          });
        }}
      >
        {studioCtx.site.pageWrapper === component ? "Unset" : "Set"} as{" "}
        <strong>default page wrapper</strong>
      </Menu.Item>
    );
  });
}

const ComponentRow = observer(function ComponentRow(props: {
  studioCtx: StudioCtx;
  readOnly: boolean;
  /** if component is from a ProjectDependency */
  dep: ProjectDependency | undefined;
  component: Component;
  isPlainComponent: boolean;
  matcher: Matcher;
  onFindReferences: () => void;
  isDragging?: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps;
  onDuplicate?: () => void;
}) {
  const {
    studioCtx,
    readOnly,
    dep,
    component,
    isPlainComponent,
    matcher,
    onFindReferences,
    isDragging,
    dragHandleProps,
    onDuplicate,
  } = props;
  const overlay = () => {
    const arena = studioCtx.currentArena;
    const builder = new MenuBuilder();
    builder.genSection(undefined, (push) => {
      if (!readOnly && isPlainComponent) {
        push(
          <Menu.Item
            key="open-dedicated-arena"
            onClick={() =>
              studioCtx.changeUnsafe(() =>
                studioCtx.switchToComponentArena(component)
              )
            }
          >
            <strong data-test-id="edit-component">Edit</strong> component
          </Menu.Item>
        );
        if (isMixedArena(arena)) {
          push(
            <Menu.Item
              key="open"
              onClick={() =>
                studioCtx.changeUnsafe(() =>
                  studioCtx.siteOps().createNewFrameForMixedArena(component)
                )
              }
            >
              <strong>Edit</strong> in new {FRAME_CAP}
            </Menu.Item>
          );
        }
      }
      if (dep) {
        push(
          <Menu.Item
            key="open-imported-component"
            onClick={() => {
              openNewTab(
                mkProjectLocation({
                  projectId: dep.projectId,
                  slug: component.name,
                  branchName: MainBranchId,
                  branchVersion: "latest",
                  arenaType: "component",
                  arenaUuidOrNameOrPath: component.uuid,
                })
              );
            }}
          >
            <strong>Open</strong> component in new tab
          </Menu.Item>
        );
      }
    });

    builder.genSection(undefined, (push) => {
      if (!readOnly && isPlainComponent) {
        push(
          <Menu.Item
            key="rename"
            onClick={async () => {
              const name = await reactPrompt({
                message: "What's the new name for this component?",
                actionText: "Rename",
                placeholder: "New component name",
                defaultValue: component.name,
              });

              if (name) {
                await studioCtx.changeUnsafe(() =>
                  studioCtx.siteOps().tryRenameComponent(component, name)
                );
              }
            }}
          >
            <strong>Rename</strong> component
          </Menu.Item>
        );
      }

      if (onDuplicate) {
        push(
          <Menu.Item key="duplicate" onClick={() => onDuplicate()}>
            <strong>Duplicate</strong> component
          </Menu.Item>
        );
      }

      if (!readOnly && isPlainComponent) {
        push(
          <Menu.Item
            key="convert_to_page"
            onClick={() =>
              studioCtx.changeUnsafe(() =>
                studioCtx.siteOps().convertComponentToPage(component)
              )
            }
          >
            <strong>Convert</strong> to page
          </Menu.Item>
        );
      }
    });

    buildCommonComponentMenuItems(
      builder,
      studioCtx,
      component,
      onFindReferences
    );

    builder.genSection(undefined, (push) => {
      if (!readOnly && isPlainComponent) {
        push(
          <Menu.Item
            key="delete"
            onClick={async () => {
              const confirmation = await promptDeleteComponent(
                "component",
                component.name
              );
              if (!confirmation) return;
              await studioCtx.changeUnsafe(() =>
                studioCtx.siteOps().tryRemoveComponent(component)
              );
            }}
          >
            <strong>Delete</strong> component
          </Menu.Item>
        );
      }
    });

    return builder.build({ menuName: "component-item-menu" });
  };

  const indent = !matcher.hasQuery() ? getSuperComponents(component).length : 0;

  if (isCodeComponent(component)) {
    return (
      <CodeComponentRow {...props} component={component} indent={indent} />
    );
  }

  const defaultComponentKind = getDefaultComponentKind(
    studioCtx.site,
    component
  );
  return (
    <DraggableInsertable
      sc={studioCtx}
      spec={{
        key: component.uuid,
        label: getComponentDisplayName(component),
        factory: (vc: ViewCtx) => {
          return vc.variantTplMgr().mkTplComponentWithDefaults(component);
        },
        icon: <Icon icon={ComponentIcon} className="component-fg" />,
        type: AddItemType.tpl,
      }}
    >
      <ListItem
        isDragging={isDragging}
        isDraggable={!readOnly}
        icon={<Icon icon={ComponentIcon} />}
        menu={overlay}
        dragHandleProps={readOnly ? undefined : dragHandleProps}
        style={{
          paddingLeft: indent * 24,
        }}
        onClick={
          isPlainComponent
            ? () => {
                spawn(
                  studioCtx.change(({ success }) => {
                    studioCtx.switchToComponentArena(component);
                    return success();
                  })
                );
              }
            : undefined
        }
        data-test-id={`listitem-component-${component.name}`}
      >
        {defaultComponentKind ? (
          <Popover
            content={
              <p>
                <strong>Default component:</strong>{" "}
                {getDefaultComponentLabel(defaultComponentKind)}
              </p>
            }
          >
            <strong>
              {matcher.boldSnippets(getComponentDisplayName(component))}
            </strong>
          </Popover>
        ) : (
          matcher.boldSnippets(getComponentDisplayName(component))
        )}
      </ListItem>
    </DraggableInsertable>
  );
});

export function genComponentSwapMenuItem(
  builder: MenuBuilder,
  studioCtx: StudioCtx,
  component: Component
) {
  const doSwap = (toComp: Component) => {
    spawn(studioCtx.siteOps().swapComponents(component, toComp));
  };
  const pushComps = (
    comps: Component[],
    push: (x: React.ReactElement) => void,
    includeCodeComponents: boolean
  ) => {
    for (const comp of comps) {
      if (
        isReusableComponent(comp) &&
        comp !== component &&
        (!isCodeComponent(comp) ||
          (comp.name !== "plasmic-data-source-fetcher" &&
            (includeCodeComponents || isHostLessCodeComponent(comp)) &&
            !isContextCodeComponent(comp)))
      ) {
        push(
          <Menu.Item key={comp.uuid} onClick={() => doSwap(comp)}>
            {getComponentDisplayName(comp)}
          </Menu.Item>
        );
      }
    }
  };
  builder.genSub(
    <>
      <strong>Replace</strong> all instances of this component with...
    </>,
    (push) => {
      pushComps(studioCtx.site.components, push, true);
      for (const dep of studioCtx.site.projectDependencies) {
        builder.genSection(`Imported from "${dep.name}"`, (_push) => {
          pushComps(dep.site.components, _push, false);
        });
      }
    }
  );
}

export default LeftComponentsPanel;
