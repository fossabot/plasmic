import { TplNode } from "@/wab/classes";
import { ensure } from "@/wab/common";
import GridStyleParser from "@/wab/gen/GridStyleParser";
import { NumericSize, Size } from "@/wab/shared/Css";
import {
  ReadonlyIRuleSetHelpers,
  readonlyRSH,
} from "@/wab/shared/RuleSetHelpers";
import { CssVarResolver, expandRuleSets } from "@/wab/styles";
import { isTplTag } from "@/wab/tpls";
import { isArray, last } from "lodash";

export interface FlexibleSize {
  readonly type: "FlexibleSize";
  readonly size: NumericSize;
}

export interface FixedSize {
  readonly type: "FixedSize";
  readonly num: number;
}

export interface Track {
  readonly size: Size;
}

export interface GridSpec {
  readonly gridTemplateRows?: ReadonlyArray<Track> | FlexibleSize | FixedSize;
  readonly gridRowGap?: NumericSize;
  readonly gridAutoRows?: Size;
  readonly gridTemplateColumns?:
    | ReadonlyArray<Track>
    | FlexibleSize
    | FixedSize;
  readonly gridColumnGap?: NumericSize;
  readonly gridAutoColumns?: Size;
}

export const GRID_DEFAULT_TEMPLATE: FixedSize = {
  type: "FixedSize",
  num: 2,
};

export function parseGridCssPropsToSpec(
  rsh: ReadonlyIRuleSetHelpers,
  resolver: CssVarResolver
): GridSpec {
  const parseProp = (prop: string, startRule: string) => {
    if (!rsh.has(prop)) {
      return undefined;
    }
    const value = resolver.tryResolveTokenOrMixinRef(rsh.get(prop));
    return GridStyleParser.parse(value, {
      startRule,
    });
  };
  ensure(
    rsh.get("display") === "grid",
    "Grid element is expected to have display:grid"
  );
  return {
    gridTemplateRows: parseProp("grid-template-rows", "axisTemplate"),
    // gridRowGap: parseProp("grid-row-gap", "numSize"), needs token handling
    gridAutoRows: parseProp("grid-auto-rows", "size"),
    gridTemplateColumns: parseProp("grid-template-columns", "axisTemplate"),
    // gridColumnGap: parseProp("grid-column-gap", "numSize"), needs token handling
    gridAutoColumns: parseProp("grid-auto-columns", "size"),
  };
}

export function parseGridChildCssProps(rsh: ReadonlyIRuleSetHelpers) {
  // start: X
  // end: span Y
  return {
    row: {
      start: rsh.has("grid-row-start") ? rsh.get("grid-row-start") : undefined,
      span: rsh.has("grid-row-end")
        ? last(rsh.get("grid-row-end").split(" "))
        : undefined,
    },
    column: {
      start: rsh.has("grid-column-start")
        ? rsh.get("grid-column-start")
        : undefined,
      span: rsh.has("grid-column-end")
        ? last(rsh.get("grid-column-end").split(" "))
        : undefined,
    },
  };
}

export function isTrackTemplate(
  template: ReadonlyArray<Track> | FlexibleSize | FixedSize
): template is ReadonlyArray<Track> {
  return isArray(template);
}

export function isFlexibleSize(
  template: ReadonlyArray<Track> | FlexibleSize | FixedSize
): template is FlexibleSize {
  return !isTrackTemplate(template) && template.type === "FlexibleSize";
}

export function isGridTag(tpl: TplNode) {
  if (!isTplTag(tpl)) {
    return false;
  }
  return tpl.vsettings
    .flatMap((vs) => expandRuleSets([vs.rs]))
    .some((rs) => {
      const rsh = readonlyRSH(rs, tpl);
      return rsh.get("display") === "grid";
    });
}
