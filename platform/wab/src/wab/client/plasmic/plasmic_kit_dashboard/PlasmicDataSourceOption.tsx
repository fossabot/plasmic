// @ts-nocheck
/* eslint-disable */
/* tslint:disable */
/* prettier-ignore-start */

/** @jsxRuntime classic */
/** @jsx createPlasmicElementProxy */
/** @jsxFrag React.Fragment */

// This class is auto-generated by Plasmic; please do not edit!
// Plasmic Project: ooL7EhXDmFQWnW9sxtchhE
// Component: 89XWXKZUx6q

import * as React from "react";

import * as p from "@plasmicapp/react-web";
import * as ph from "@plasmicapp/react-web/lib/host";

import {
  hasVariant,
  classNames,
  wrapWithClassName,
  createPlasmicElementProxy,
  makeFragment,
  MultiChoiceArg,
  SingleBooleanChoiceArg,
  SingleChoiceArg,
  pick,
  omit,
  useTrigger,
  StrictProps,
  deriveRenderOpts,
  ensureGlobalVariants,
} from "@plasmicapp/react-web";

import "@plasmicapp/react-web/lib/plasmic.css";

import plasmic_plasmic_kit_design_system_deprecated_css from "../PP__plasmickit_design_system.module.css"; // plasmic-import: tXkSR39sgCDWSitZxC5xFV/projectcss
import plasmic_plasmic_kit_color_tokens_css from "../plasmic_kit_q_4_color_tokens/plasmic_plasmic_kit_q_4_color_tokens.module.css"; // plasmic-import: 95xp9cYcv7HrNWpFWWhbcv/projectcss
import plasmic_plasmic_kit_pricing_css from "../plasmic_kit_pricing/plasmic_plasmic_kit_pricing.module.css"; // plasmic-import: ehckhYnyDHgCBbV47m9bkf/projectcss
import projectcss from "../PP__plasmickit_dashboard.module.css"; // plasmic-import: ooL7EhXDmFQWnW9sxtchhE/projectcss
import sty from "./PlasmicDataSourceOption.module.css"; // plasmic-import: 89XWXKZUx6q/css

import Icon19Icon from "./icons/PlasmicIcon__Icon19"; // plasmic-import: MHEeMLIhlB/icon

createPlasmicElementProxy;

export type PlasmicDataSourceOption__VariantMembers = {
  selected: "selected";
};
export type PlasmicDataSourceOption__VariantsArgs = {
  selected?: SingleBooleanChoiceArg<"selected">;
};
type VariantPropType = keyof PlasmicDataSourceOption__VariantsArgs;
export const PlasmicDataSourceOption__VariantProps = new Array<VariantPropType>(
  "selected"
);

export type PlasmicDataSourceOption__ArgsType = {
  name?: React.ReactNode;
  href?: string;
  icon?: React.ReactNode;
};
type ArgPropType = keyof PlasmicDataSourceOption__ArgsType;
export const PlasmicDataSourceOption__ArgProps = new Array<ArgPropType>(
  "name",
  "href",
  "icon"
);

export type PlasmicDataSourceOption__OverridesType = {
  root?: p.Flex<"a">;
  freeBox?: p.Flex<"div">;
};

export interface DefaultDataSourceOptionProps {
  name?: React.ReactNode;
  href?: string;
  icon?: React.ReactNode;
  selected?: SingleBooleanChoiceArg<"selected">;
  className?: string;
}

const $$ = {};

function PlasmicDataSourceOption__RenderFunc(props: {
  variants: PlasmicDataSourceOption__VariantsArgs;
  args: PlasmicDataSourceOption__ArgsType;
  overrides: PlasmicDataSourceOption__OverridesType;
  forNode?: string;
}) {
  const { variants, overrides, forNode } = props;

  const args = React.useMemo(() => Object.assign({}, props.args), [props.args]);

  const $props = {
    ...args,
    ...variants,
  };

  const $ctx = ph.useDataEnv?.() || {};
  const refsRef = React.useRef({});
  const $refs = refsRef.current;

  const currentUser = p.useCurrentUser?.() || {};

  const stateSpecs: Parameters<typeof p.useDollarState>[0] = React.useMemo(
    () => [
      {
        path: "selected",
        type: "private",
        variableType: "variant",
        initFunc: ({ $props, $state, $queries, $ctx }) => $props.selected,
      },
    ],
    [$props, $ctx, $refs]
  );
  const $state = p.useDollarState(stateSpecs, {
    $props,
    $ctx,
    $queries: {},
    $refs,
  });

  return (
    <p.Stack
      as={"a"}
      data-plasmic-name={"root"}
      data-plasmic-override={overrides.root}
      data-plasmic-root={true}
      data-plasmic-for-node={forNode}
      hasGap={true}
      className={classNames(
        projectcss.all,
        projectcss.a,
        projectcss.root_reset,
        projectcss.plasmic_default_styles,
        projectcss.plasmic_mixins,
        projectcss.plasmic_tokens,
        plasmic_plasmic_kit_design_system_deprecated_css.plasmic_tokens,
        plasmic_plasmic_kit_color_tokens_css.plasmic_tokens,
        plasmic_plasmic_kit_pricing_css.plasmic_tokens,
        sty.root,
        { [sty.rootselected]: hasVariant($state, "selected", "selected") }
      )}
      href={args.href}
    >
      <div
        data-plasmic-name={"freeBox"}
        data-plasmic-override={overrides.freeBox}
        className={classNames(projectcss.all, sty.freeBox)}
      >
        {p.renderPlasmicSlot({
          defaultContents: (
            <Icon19Icon
              className={classNames(projectcss.all, sty.svg___25JfE)}
              role={"img"}
            />
          ),

          value: args.icon,
          className: classNames(sty.slotTargetIcon),
        })}
      </div>
      {p.renderPlasmicSlot({
        defaultContents: "My Airtable Data Source",
        value: args.name,
        className: classNames(sty.slotTargetName, {
          [sty.slotTargetNameselected]: hasVariant(
            $state,
            "selected",
            "selected"
          ),
        }),
      })}
    </p.Stack>
  ) as React.ReactElement | null;
}

const PlasmicDescendants = {
  root: ["root", "freeBox"],
  freeBox: ["freeBox"],
} as const;
type NodeNameType = keyof typeof PlasmicDescendants;
type DescendantsType<T extends NodeNameType> =
  (typeof PlasmicDescendants)[T][number];
type NodeDefaultElementType = {
  root: "a";
  freeBox: "div";
};

type ReservedPropsType = "variants" | "args" | "overrides";
type NodeOverridesType<T extends NodeNameType> = Pick<
  PlasmicDataSourceOption__OverridesType,
  DescendantsType<T>
>;
type NodeComponentProps<T extends NodeNameType> =
  // Explicitly specify variants, args, and overrides as objects
  {
    variants?: PlasmicDataSourceOption__VariantsArgs;
    args?: PlasmicDataSourceOption__ArgsType;
    overrides?: NodeOverridesType<T>;
  } & Omit<PlasmicDataSourceOption__VariantsArgs, ReservedPropsType> & // Specify variants directly as props
    /* Specify args directly as props*/ Omit<
      PlasmicDataSourceOption__ArgsType,
      ReservedPropsType
    > &
    /* Specify overrides for each element directly as props*/ Omit<
      NodeOverridesType<T>,
      ReservedPropsType | VariantPropType | ArgPropType
    > &
    /* Specify props for the root element*/ Omit<
      Partial<React.ComponentProps<NodeDefaultElementType[T]>>,
      ReservedPropsType | VariantPropType | ArgPropType | DescendantsType<T>
    >;

function makeNodeComponent<NodeName extends NodeNameType>(nodeName: NodeName) {
  type PropsType = NodeComponentProps<NodeName> & { key?: React.Key };
  const func = function <T extends PropsType>(
    props: T & StrictProps<T, PropsType>
  ) {
    const { variants, args, overrides } = React.useMemo(
      () =>
        deriveRenderOpts(props, {
          name: nodeName,
          descendantNames: [...PlasmicDescendants[nodeName]],
          internalArgPropNames: PlasmicDataSourceOption__ArgProps,
          internalVariantPropNames: PlasmicDataSourceOption__VariantProps,
        }),
      [props, nodeName]
    );
    return PlasmicDataSourceOption__RenderFunc({
      variants,
      args,
      overrides,
      forNode: nodeName,
    });
  };
  if (nodeName === "root") {
    func.displayName = "PlasmicDataSourceOption";
  } else {
    func.displayName = `PlasmicDataSourceOption.${nodeName}`;
  }
  return func;
}

export const PlasmicDataSourceOption = Object.assign(
  // Top-level PlasmicDataSourceOption renders the root element
  makeNodeComponent("root"),
  {
    // Helper components rendering sub-elements
    freeBox: makeNodeComponent("freeBox"),

    // Metadata about props expected for PlasmicDataSourceOption
    internalVariantProps: PlasmicDataSourceOption__VariantProps,
    internalArgProps: PlasmicDataSourceOption__ArgProps,
  }
);

export default PlasmicDataSourceOption;
/* prettier-ignore-end */