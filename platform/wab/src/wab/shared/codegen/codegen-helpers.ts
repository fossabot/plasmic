import { Component, Site, TplNode, VariantSetting } from "@/wab/classes";
import { DeepMap, deepMapMemoized } from "@/wab/commons/deep-map";
import { buildObjToDepMap } from "@/wab/project-deps";
import { makeTokenRefResolver } from "@/wab/shared/cached-selectors";
import { extractUsedTokensForTheme } from "@/wab/shared/codegen/style-tokens";
import { getEffectiveVariantSetting } from "@/wab/shared/effective-variant-setting";
import { makeLayoutAwareRuleSet } from "@/wab/shared/layoututils";
import { readonlyRSH } from "@/wab/shared/RuleSetHelpers";
import {
  isTextArgNodeOfSlot,
  shouldWrapSlotContentInDataCtxReader,
} from "@/wab/shared/SlotUtils";
import { $$$ } from "@/wab/shared/TplQuery";
import {
  makeVariantComboSorter,
  sortedVariantSettings,
} from "@/wab/shared/variant-sort";
import { isBaseVariant, VariantCombo } from "@/wab/shared/Variants";
import { allImageAssets, allMixins, allStyleTokens } from "@/wab/sites";
import {
  createExpandedRuleSetMerger,
  CssVarResolver,
  hasGapStyle,
} from "@/wab/styles";
import { flattenTpls } from "@/wab/tpls";
import { keyBy } from "lodash";

export class SiteGenHelper {
  private cache: Map<string, DeepMap<any>> = new Map();
  constructor(public site: Site, public isStudio: boolean) {}

  makeTokenRefResolver = deepMapMemoized(
    this.cache,
    () => makeTokenRefResolver(this.site),
    {
      funcKey: "makeTokenRefResolver",
    }
  );
  allStyleTokens = deepMapMemoized(
    this.cache,
    () => allStyleTokens(this.site, { includeDeps: "all" }),
    { funcKey: "allStyleTokens" }
  );
  allMixins = deepMapMemoized(
    this.cache,
    () => allMixins(this.site, { includeDeps: "all" }),
    { funcKey: "allMixins" }
  );
  allImageAssets = deepMapMemoized(
    this.cache,
    () => allImageAssets(this.site, { includeDeps: "all" }),
    { funcKey: "allImageAssets" }
  );
  shouldWrapSlotContentInDataCtxReader = deepMapMemoized(
    this.cache,
    shouldWrapSlotContentInDataCtxReader,
    {
      funcKey: "shouldWrapSlotContentInDataCtxReader",
    }
  );
  objToDepMap = deepMapMemoized(this.cache, () => buildObjToDepMap(this.site), {
    funcKey: "objToDepmap",
  });
  usedTokensForTheme = deepMapMemoized(
    this.cache,
    () => {
      return extractUsedTokensForTheme(
        this.site,
        keyBy(this.allStyleTokens(), (t) => t.uuid),
        { derefTokens: true }
      );
    },
    { funcKey: "usedTokensForTheme" }
  );
}

export class ComponentGenHelper {
  private cache: Map<string, DeepMap<any>> = new Map();
  constructor(
    public siteHelper: SiteGenHelper,
    public resolver: CssVarResolver | undefined
  ) {}

  get site() {
    return this.siteHelper.site;
  }

  get isStudio() {
    return this.siteHelper.isStudio;
  }

  variantComboSorter = deepMapMemoized(
    this.cache,
    (component: Component) => {
      return makeVariantComboSorter(this.site, component);
    },
    {
      funcKey: "variantComboSorter",
    }
  );
  getExpr = deepMapMemoized(
    this.cache,
    (tpl: TplNode, vs: VariantSetting) => {
      const rs = this.makeLayoutAwareRuleSet(vs.rs, isBaseVariant(vs.variants));
      if (rs.mixins.length === 0) {
        return readonlyRSH(rs, tpl);
      } else {
        return createExpandedRuleSetMerger(rs, tpl);
      }
    },
    { funcKey: "getExpr" }
  );
  getEffectiveVariantSetting = deepMapMemoized(
    this.cache,
    (tpl: TplNode, activeVariants: VariantCombo) => {
      return getEffectiveVariantSetting(
        tpl,
        activeVariants,
        this.variantComboSorter(this.owningComponent(tpl))
      );
    },
    {
      funcKey: "getEffectiveVariantSetting",
      argKeys: ([tpl, activeVariants]) => [
        tpl,
        activeVariants.map((v) => v.uuid).join("-"),
      ],
    }
  );
  owningComponent = deepMapMemoized(
    this.cache,
    (tpl: TplNode) => $$$(tpl).owningComponent(),
    { funcKey: "owningComponent" }
  );
  getEffectiveExpr = deepMapMemoized(
    this.cache,
    (tpl: TplNode, variantCombo: VariantCombo) => {
      return this.getEffectiveVariantSetting(tpl, variantCombo).rsh();
    },
    { funcKey: "getEffectiveExpr" }
  );
  getEffectiveExprWithTheme = deepMapMemoized(
    this.cache,
    (tpl: TplNode, variantCombo: VariantCombo) => {
      return this.getEffectiveVariantSetting(tpl, variantCombo).rshWithTheme();
    },
    { funcKey: "getEffectiveExprWithTheme" }
  );
  makeLayoutAwareRuleSet = deepMapMemoized(this.cache, makeLayoutAwareRuleSet, {
    funcKey: "makeLayoutAwareRuleSet",
  });
  layoutParent = deepMapMemoized(
    this.cache,
    function layoutParent(tpl: TplNode) {
      return $$$(tpl).layoutParent().maybeOneTpl();
    },
    { funcKey: "layoutParent" }
  );
  deepLayoutParent = deepMapMemoized(
    this.cache,
    function layoutParent(tpl: TplNode) {
      return $$$(tpl).layoutParent({ throughSlot: true }).maybeOneTpl();
    },
    { funcKey: "deepLayoutParent" }
  );
  isTextArgNodeOfSlot = deepMapMemoized(this.cache, isTextArgNodeOfSlot, {
    funcKey: "isTextArgNodeOfSlot",
  });
  hasGapStyle = deepMapMemoized(this.cache, hasGapStyle, {
    funcKey: "hasGapStyle",
  });
  getSortedVSettings = deepMapMemoized(
    this.cache,
    (node: TplNode) => {
      const component = this.owningComponent(node);
      const sorter = this.variantComboSorter(component);
      return sortedVariantSettings(node.vsettings, sorter);
    },
    { funcKey: "getSortedVSettings" }
  );
  flattenComponent = deepMapMemoized(
    this.cache,
    (component: Component) => flattenTpls(component.tplTree),
    { funcKey: "flattenComponent" }
  );
}
