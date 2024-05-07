import {
  Component,
  isKnownArenaFrame,
  isKnownTplNode,
  ProjectDependency,
  Site,
  TplNode,
  Variant,
} from "@/wab/classes";
import { ViewOps } from "@/wab/client/components/canvas/view-ops";
import { promptChooseItem } from "@/wab/client/components/modals/ChooseItemModal";
import {
  normalizeTemplateSpec,
  StudioCtx,
} from "@/wab/client/studio-ctx/StudioCtx";
import { ViewCtx } from "@/wab/client/studio-ctx/view-ctx";
import { ensure, maybe, unexpected } from "@/wab/common";
import { PageComponent } from "@/wab/components";
import {
  flattenInsertableTemplatesByType,
  InsertableTemplateComponentResolution,
  InsertableTemplatesGroup,
  InsertableTemplatesItem,
  InsertableTemplateTokenResolution,
} from "@/wab/devflags";
import { BranchId } from "@/wab/shared/ApiSchema";
import { FastBundler } from "@/wab/shared/bundler";
import { Bundle, getBundle } from "@/wab/shared/bundles";
import { cloneInsertableTemplate } from "@/wab/shared/insertable-templates";
import {
  CopyElementsReference,
  CopyState,
  CopyStateBundleRef,
  CopyStateExtraInfo,
  InsertableTemplateExtraInfo,
} from "@/wab/shared/insertable-templates/types";
import { PkgInfo, PkgVersionInfo } from "@/wab/shared/SharedApi";
import { $$$ } from "@/wab/shared/TplQuery";
import { getBaseVariant } from "@/wab/shared/Variants";
import { unbundleProjectDependency, unbundleSite } from "@/wab/tagged-unbundle";
import { deepTrackComponents } from "@/wab/tpls";
import { flatten, fromPairs, isArray } from "lodash";

export const getPageTemplatesGroups = (studioCtx: StudioCtx) => {
  const insertableTemplates =
    maybe(studioCtx.getCurrentUiConfig()?.pageTemplates, (x) =>
      normalizeTemplateSpec(x, true)
    ) ?? studioCtx.appCtx.appConfig.insertableTemplates;
  if (!insertableTemplates) {
    return [];
  }
  const pageTemplatesGroups = insertableTemplates.items.filter(
    (i) => i.type === "insertable-templates-group" && i.isPageTemplatesGroup
  );
  return pageTemplatesGroups as InsertableTemplatesGroup[];
};

export const getPageTemplates = (studioCtx: StudioCtx) => {
  const pageTemplates = flatten(
    getPageTemplatesGroups(studioCtx).map((g) => g.items)
  ).filter((i) => i.type === "insertable-templates-item");
  return pageTemplates as InsertableTemplatesItem[];
};

export const getInsertableTemplatesGroups = (studioCtx: StudioCtx) => {
  const insertableTemplates =
    maybe(studioCtx.getCurrentUiConfig()?.insertableTemplates, (x) =>
      normalizeTemplateSpec(x, false)
    ) ?? studioCtx.appCtx.appConfig.insertableTemplates;
  if (!insertableTemplates) {
    return [];
  }
  const insertableTemplatesGrups = insertableTemplates.items.filter(
    (i) => i.type === "insertable-templates-group" && !i.isPageTemplatesGroup
  );
  return insertableTemplatesGrups as InsertableTemplatesGroup[];
};

export const getInsertableTemplates = (studioCtx: StudioCtx) => {
  const insertableTemplates = flatten(
    getInsertableTemplatesGroups(studioCtx).map((g) => g.items)
  ).filter((i) => i.type === "insertable-templates-item");
  return insertableTemplates as InsertableTemplatesItem[];
};

export const getAllTemplates = (studioCtx: StudioCtx) => {
  return [...getInsertableTemplates(studioCtx), ...getPageTemplates(studioCtx)];
};

export const getPageTemplate = (
  studioCtx: StudioCtx,
  projectId: string,
  componentName: string
) => {
  const pageTemplates = getPageTemplates(studioCtx);
  const pageTemplate = pageTemplates.find(
    (tmpl) =>
      tmpl.projectId === projectId && tmpl.componentName === componentName
  );
  return pageTemplate;
};

export const getInsertablePageTemplateComponent = (
  studioCtx: StudioCtx,
  chosenTemplate: {
    componentName?: string;
    projectId?: string;
  }
) => {
  if (!chosenTemplate.componentName || !chosenTemplate.projectId) {
    return;
  }

  const pageTemplate = getPageTemplate(
    studioCtx,
    chosenTemplate.projectId,
    chosenTemplate.componentName
  );
  if (!pageTemplate) {
    return;
  }

  const it =
    studioCtx.projectDependencyManager.getInsertableTemplate(pageTemplate);
  if (!it) {
    return;
  }

  return it;
};

export const replaceWithPageTemplate = (
  studioCtx: StudioCtx,
  page: PageComponent,
  templateInfo: InsertableTemplateExtraInfo
) => {
  const { tpl: toBeInserted, seenFonts } = cloneInsertableTemplate(
    studioCtx.site,
    templateInfo,
    getBaseVariant(page),
    studioCtx.projectDependencyManager.plumeSite,
    page
  );
  postInsertableTemplate(studioCtx, seenFonts);

  $$$(page.tplTree).replaceWith(toBeInserted);
};

export function postInsertableTemplate(
  studioCtx: StudioCtx,
  seenFonts: Set<string>
) {
  // hostless dependencies may have been updated
  studioCtx.projectDependencyManager.syncDirectDeps();

  // Add new fonts to font manager
  for (const font of seenFonts) {
    studioCtx.fontManager.useFont(studioCtx, font);
  }
}

export const getScreenVariantToInsertableTemplate = async (
  studioCtx: StudioCtx
) => {
  const baseVariant = undefined;
  const site = studioCtx.site;
  const screenVariantGroup = site.activeScreenVariantGroup;
  if (studioCtx.projectDependencyManager.insertableSiteScreenVariant) {
    // If we remember the last choice we made
    return {
      baseVariant,
      screenVariant:
        studioCtx.projectDependencyManager.insertableSiteScreenVariant,
    };
  } else if (!screenVariantGroup || screenVariantGroup.variants.length <= 0) {
    // If there is no screen variants
    return {
      baseVariant,
      screenVariant: undefined,
    };
  } else if (screenVariantGroup.variants.length === 1) {
    // If there is only 1, so the mapping is obvious
    return {
      baseVariant,
      screenVariant: screenVariantGroup?.variants[0],
    };
  } else {
    // Ask the user which one to use
    const result = await promptChooseItem({
      title: "Choose a responsive breakpoint",
      description:
        "This template can be responsive to the screen size. Please choose which responsive breakpoint to use.",
      group: screenVariantGroup.variants.map((v) => {
        return {
          name: v.name,
          item: v,
        };
      }),
    });
    const screenVariant = result ? result.item : undefined;
    studioCtx.projectDependencyManager.insertableSiteScreenVariant =
      screenVariant;
    return {
      baseVariant,
      screenVariant,
    };
  }
};

export const getVariantsToInsertableTemplate = async (
  studioCtx: StudioCtx,
  component: Component
) => {
  const baseVariant = getBaseVariant(component);
  const { screenVariant } = await getScreenVariantToInsertableTemplate(
    studioCtx
  );
  return {
    baseVariant,
    screenVariant,
  };
};

export const getHostLessDependenciesToInsertableTemplate = async (
  studioCtx: StudioCtx,
  sourceSite: Site
) => {
  const appCtx = studioCtx.appCtx;
  const hostLessProjectIds = sourceSite.projectDependencies
    .filter((dep) => dep.site.hostLessPackageInfo)
    .map((dep) => dep.projectId);
  const hostLessDependencies = fromPairs(
    await Promise.all(
      hostLessProjectIds.map(async (hostLessProjectId) => {
        const { pkg: maybePkg } = await appCtx.api.getPkgByProjectId(
          hostLessProjectId
        );
        const pkg = ensure(maybePkg, "Hostless package should exist");
        const { pkg: latest, depPkgs } = await appCtx.api.getPkgVersion(pkg.id);
        const { projectDependency } = unbundleProjectDependency(
          studioCtx.bundler(),
          latest,
          depPkgs
        );
        return [
          hostLessProjectId,
          {
            pkg,
            projectDependency,
          },
        ] as [
          string,
          {
            pkg: PkgInfo;
            projectDependency: ProjectDependency;
          }
        ];
      })
    )
  );

  return {
    hostLessDependencies,
  };
};

export async function buildInsertableExtraInfo(
  studioCtx: StudioCtx,
  projectId: string,
  componentName: string,
  screenVariant: Variant | undefined
): Promise<InsertableTemplateExtraInfo | undefined> {
  await studioCtx.projectDependencyManager.fetchInsertableTemplate(projectId);

  const it = studioCtx.projectDependencyManager.getInsertableTemplate({
    projectId,
    componentName,
  });
  if (!it) {
    return undefined;
  }

  const template = getAllTemplates(studioCtx).find(
    (c) => c.projectId === projectId && c.componentName === componentName
  );

  return {
    ...it,
    screenVariant,
    ...(await getHostLessDependenciesToInsertableTemplate(studioCtx, it.site)),
    projectId,
    resolution: {
      token: template?.tokenResolution,
      component: template?.componentResolution,
    },
  };
}

export function getInsertableTemplateComponentItems(studioCtx: StudioCtx) {
  return flattenInsertableTemplatesByType(
    studioCtx.appCtx.appConfig.insertableTemplates,
    "insertable-templates-component"
  );
}

export function getInsertableTemplateComponentItem(
  studioCtx: StudioCtx,
  templateName: string
) {
  return getInsertableTemplateComponentItems(studioCtx).find(
    (i) => i.templateName === templateName
  );
}

export function createCopyableElementsReferences(
  viewCtx: ViewCtx,
  copyObj: ReturnType<ViewOps["copy"]>
): CopyElementsReference[] {
  // Copy paste will only handle single tplNodes for now
  if (isArray(copyObj)) {
    // No need for pasting multiple elements for now
    return [];
  } else {
    function tplNodeRef(node: TplNode): CopyElementsReference {
      const activeVariants = viewCtx
        .variantTplMgr()
        .getActivatedVariantsForNode(node);
      return {
        type: "tpl-node",
        uuid: node.uuid,
        activeVariantsUuids: [...activeVariants].map((v) => v.uuid),
      };
    }

    if (isKnownTplNode(copyObj)) {
      return [tplNodeRef(copyObj)];
    } else if (isKnownArenaFrame(copyObj)) {
      // We have some options here:
      // 1. Copy the entire frame as a frame
      // 2. Import the component which the frame is based on
      // 3. Copy the tree of the component
      // For now, the most natural thing to do is to copy the tree of the component
      const node = copyObj.container.component.tplTree;
      return [tplNodeRef(node)];
    }
  }
  unexpected("Unknown copyable element type");
}

export const PLASMIC_COPY_PREFIX = "pl-copy;";

export function getCopyState(
  viewCtx: ViewCtx,
  copyObj: ReturnType<ViewOps["copy"]>
): CopyState {
  const references = createCopyableElementsReferences(viewCtx, copyObj);

  const currentComponent = viewCtx.currentComponent();

  const dbCtx = viewCtx.dbCtx();

  function getBundleRef(): CopyStateBundleRef {
    if (dbCtx.pkgVersionInfoMeta) {
      return {
        type: "pkg",
        // This is a stable package version, so the copy and paste will be stable
        pkgId: dbCtx.pkgVersionInfoMeta.pkgId,
        version: dbCtx.pkgVersionInfoMeta.version,
      };
    }
    return {
      type: "revision",
      // We include revisionNum so that we reference this exact state, but this
      // implies that eventually the copy state will reference a non existent
      // revision likely, but this is fine, copy and paste is not meant to be
      // take a long time
      revisionNum: dbCtx.revisionNum,
    };
  }

  const state: CopyState = {
    action: "cross-tab-copy",
    projectId: viewCtx.studioCtx.siteInfo.id,
    branchId: dbCtx.branchInfo?.id,
    bundleRef: getBundleRef(),
    componentUuid: currentComponent.uuid,
    componentName: currentComponent.name,
    references,
  };

  return state;
}

export function isCopyState(x: any): x is CopyState {
  return "action" in x && x.action === "cross-tab-copy";
}

async function resolveBundleRef(
  studioCtx: StudioCtx,
  state: CopyState
): Promise<{
  bundle: Bundle;
  depPkgs: PkgVersionInfo[];
}> {
  const ref = state.bundleRef;
  if (ref.type === "pkg") {
    const { pkg, depPkgs } = await studioCtx.appCtx.api.getPkgVersion(
      ref.pkgId,
      ref.version,
      state.branchId
    );
    return { bundle: pkg.model, depPkgs };
  }
  const { rev, depPkgs } = await studioCtx.appCtx.api.getSiteInfo(
    state.projectId,
    {
      revisionNum: ref.revisionNum,
      branchId: state.branchId as BranchId | undefined,
    }
  );
  return {
    bundle: getBundle(rev, studioCtx.appCtx.lastBundleVersion),
    depPkgs,
  };
}

export async function buildCopyStateExtraInfo(
  studioCtx: StudioCtx,
  state: CopyState
): Promise<CopyStateExtraInfo> {
  const { projectId, componentUuid, componentName, references, bundleRef } =
    state;

  const site = await studioCtx.app.withSpinner(
    (async () => {
      // TODO: For copy and paste to work, we are downloading the entire site info
      // for the project. This is not ideal and we should find a way to avoid this.

      const { bundle, depPkgs } = await resolveBundleRef(studioCtx, state);

      const bundler = new FastBundler();

      const { site: originSite } = unbundleSite(
        bundler,
        projectId,
        bundle,
        depPkgs
      );

      // Be sure to track it, so that we can properly to do some fixups
      // as effectiveVs may require `getTplOwnerComponent`
      deepTrackComponents(originSite);

      return originSite;
    })()
  );

  // Don't add spinner wrapper, as this may prompt the user to select a screen variant
  const { screenVariant } = await getScreenVariantToInsertableTemplate(
    studioCtx
  );

  // This hostless dependencies have been unbundled with the current studio
  // bundler which makes them compatible to be installed in the current site
  const { hostLessDependencies } = await studioCtx.app.withSpinner(
    getHostLessDependenciesToInsertableTemplate(studioCtx, site)
  );

  const resolution: {
    token?: InsertableTemplateTokenResolution;
    component?: InsertableTemplateComponentResolution;
  } = {
    token: "reuse-by-name",
    component: "reuse",
  };

  const component = ensure(
    site.components.find((c) => c.uuid === componentUuid),
    `Component "${componentName}" was not found to paste content`
  );

  return {
    projectId,
    site,
    screenVariant,
    hostLessDependencies,
    resolution,
    component,
    references,
  };
}
