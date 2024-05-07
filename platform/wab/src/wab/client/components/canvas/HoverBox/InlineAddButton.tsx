import { isKnownTplNode, TplTag } from "@/wab/classes";
import styles from "@/wab/client/components/canvas/HoverBox/InlineAddButton.module.scss";
import { InlineAddDrawer } from "@/wab/client/components/canvas/InlineAddDrawer";
import { Icon } from "@/wab/client/components/widgets/Icon";
import { isDescendant } from "@/wab/client/dom-utils";
import { useDismissibleStudioOverlay } from "@/wab/client/hooks/useDismissibleStudioOverlay";
import PlusIcon from "@/wab/client/plasmic/plasmic_kit/PlasmicIcon__Plus";
import { useStudioCtx } from "@/wab/client/studio-ctx/StudioCtx";
import { getContainerType } from "@/wab/client/utils/tpl-client-utils";
import { ContainerLayoutType } from "@/wab/shared/layoututils";
import { SlotSelection } from "@/wab/slots";
import {
  isComponentRoot,
  isTplColumn,
  isTplContainer,
  isTplTextBlock,
} from "@/wab/tpls";
import cn from "classnames";
import { observer } from "mobx-react";
import * as React from "react";
import {
  CSSProperties,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useOverlayPosition } from "react-aria";

const BUTTON_SIZE = 30;
const BUTTON_MARGIN = 15;

export const OldInlineAddButton = observer(_OldInlineAddButton);
function _OldInlineAddButton({
  elementWidth = 0,
  elementHeight = 0,
  dimensionsBoxWidth = 0,
}: {
  elementWidth?: number;
  elementHeight?: number;
  dimensionsBoxWidth?: number;
}) {
  const studioCtx = useStudioCtx();
  const overlayRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isPositionUpdated, setPositionUpdated] = useState(false);
  const isOpen = studioCtx.showInlineAddDrawer();

  const viewCtx = studioCtx.focusedViewCtx();
  const focusedNode = viewCtx?.focusedTplOrSlotSelection();
  const shouldShowButton =
    !viewCtx?.editingTextContext() &&
    viewCtx?.focusedSelectable() &&
    !(isTplTextBlock(focusedNode) && isTplTextBlock(focusedNode.parent));
  const isColumn = isKnownTplNode(focusedNode) && isTplColumn(focusedNode);
  const isSlot = focusedNode instanceof SlotSelection;
  const isContainer =
    isKnownTplNode(focusedNode) && isTplContainer(focusedNode);
  const isEmptyContainer =
    isContainer && (focusedNode as TplTag)?.children?.length === 0;
  const _isComponentRoot =
    isKnownTplNode(focusedNode) && isComponentRoot(focusedNode);
  const canRenderButtonInside =
    isSlot || isEmptyContainer || _isComponentRoot || isColumn;
  const parentContainerType =
    isKnownTplNode(focusedNode) &&
    getContainerType(focusedNode.parent, viewCtx);
  const parentIsFlexRow = parentContainerType === ContainerLayoutType.flexRow;

  const visibleWidth = elementWidth * studioCtx.zoom;
  const visibleHeight = elementHeight * studioCtx.zoom;

  // Enough space depends on where it'll be rendered
  const hasEnoughSpace =
    !parentIsFlexRow && !canRenderButtonInside
      ? // In case it'll be rendered on the right bottom edge
        visibleWidth > dimensionsBoxWidth + BUTTON_SIZE * 2 + BUTTON_MARGIN * 3
      : // Else
        visibleHeight > BUTTON_SIZE * 2 + BUTTON_MARGIN * 3;

  // When the visible width is smalled than the dimensions box,
  // we need to displace the button properly
  const shouldAddExtraSpacing =
    !hasEnoughSpace && visibleWidth < dimensionsBoxWidth;

  const { overlayProps, updatePosition } = useOverlayPosition({
    overlayRef,
    isOpen,
    targetRef: triggerRef as RefObject<any>,
    shouldFlip: false,
    shouldUpdatePosition: true,
    placement: "right top",
  });

  const overlayStyle: CSSProperties = useMemo(
    () => ({
      ...overlayProps.style,
      visibility: isPositionUpdated ? "visible" : "hidden",
    }),
    [isPositionUpdated, overlayProps.style]
  );

  const onDismiss = useCallback((e?: Event) => {
    studioCtx.setShowInlineAddDrawer(false);

    // If trying to dismiss by clicking the "add button",
    // stop propagation so onTriggerClick doesn't open it again
    if (
      e?.target &&
      isDescendant({
        parent: triggerRef.current as HTMLElement,
        child: e.target as HTMLElement,
      })
    ) {
      e.stopPropagation();
    }
  }, []);

  const onTriggerClick = useCallback(
    (e) => {
      e.stopPropagation();
      studioCtx.setShowInlineAddDrawer(!isOpen);
      setPositionUpdated(false);
    },
    [isOpen]
  );

  useDismissibleStudioOverlay({
    isOpen,
    overlayRef,
    onDismiss,
  });

  useLayoutEffect(() => {
    updatePosition();
    setPositionUpdated(true);
  }, [isOpen, updatePosition]);

  // Update open state when unmounting
  useEffect(() => () => studioCtx.setShowInlineAddDrawer(false), []);

  return shouldShowButton ? (
    <>
      <div
        ref={triggerRef}
        className={cn(styles.inlineAddButton, {
          [styles.inside]: canRenderButtonInside,
          [styles.bottomEdge]: !parentIsFlexRow && !canRenderButtonInside,
          [styles.rightEdge]: parentIsFlexRow && !canRenderButtonInside,
          [styles.outside]: !hasEnoughSpace,
        })}
        style={
          shouldAddExtraSpacing
            ? {
                transform: `translateX(${
                  (dimensionsBoxWidth - visibleWidth) / 2
                }px) `,
              }
            : {}
        }
        onClick={onTriggerClick}
        data-event="add-button-inlined"
      >
        <Icon icon={PlusIcon} />
      </div>
      {isOpen && (
        <InlineAddDrawer
          ref={overlayRef}
          isOpen={isOpen}
          onDismiss={onDismiss}
          style={overlayStyle}
        />
      )}
    </>
  ) : null;
}

export const NewInlineAddButton = observer(_NewInlineAddButton);
function _NewInlineAddButton({
  elementWidth = 0,
  elementHeight = 0,
  dimensionsBoxWidth = 0,
}: {
  elementWidth?: number;
  elementHeight?: number;
  dimensionsBoxWidth?: number;
}) {
  const studioCtx = useStudioCtx();

  const viewCtx = studioCtx.focusedViewCtx();
  const focusedNode = viewCtx?.focusedTplOrSlotSelection();
  const shouldShowButton =
    !viewCtx?.editingTextContext() &&
    viewCtx?.focusedSelectable() &&
    !(isTplTextBlock(focusedNode) && isTplTextBlock(focusedNode.parent));
  const isColumn = isKnownTplNode(focusedNode) && isTplColumn(focusedNode);
  const isSlot = focusedNode instanceof SlotSelection;
  const isContainer =
    isKnownTplNode(focusedNode) && isTplContainer(focusedNode);
  const isEmptyContainer =
    isContainer && (focusedNode as TplTag)?.children?.length === 0;
  const _isComponentRoot =
    isKnownTplNode(focusedNode) && isComponentRoot(focusedNode);
  const canRenderButtonInside =
    isSlot || isEmptyContainer || _isComponentRoot || isColumn;
  const parentContainerType =
    isKnownTplNode(focusedNode) &&
    getContainerType(focusedNode.parent, viewCtx);
  const parentIsFlexRow = parentContainerType === ContainerLayoutType.flexRow;

  const visibleWidth = elementWidth * studioCtx.zoom;
  const visibleHeight = elementHeight * studioCtx.zoom;

  // Enough space depends on where it'll be rendered
  const hasEnoughSpace =
    !parentIsFlexRow && !canRenderButtonInside
      ? // In case it'll be rendered on the right bottom edge
        visibleWidth > dimensionsBoxWidth + BUTTON_SIZE * 2 + BUTTON_MARGIN * 3
      : // Else
        visibleHeight > BUTTON_SIZE * 2 + BUTTON_MARGIN * 3;

  // When the visible width is smalled than the dimensions box,
  // we need to displace the button properly
  const shouldAddExtraSpacing =
    !hasEnoughSpace && visibleWidth < dimensionsBoxWidth;

  return shouldShowButton ? (
    <>
      <button
        className={cn(styles.inlineAddButton, {
          [styles.inside]: canRenderButtonInside,
          [styles.bottomEdge]: !parentIsFlexRow && !canRenderButtonInside,
          [styles.rightEdge]: parentIsFlexRow && !canRenderButtonInside,
          [styles.outside]: !hasEnoughSpace,
        })}
        style={
          shouldAddExtraSpacing
            ? {
                transform: `translateX(${
                  (dimensionsBoxWidth - visibleWidth) / 2
                }px) `,
              }
            : {}
        }
        onClick={() =>
          studioCtx.changeUnsafe(() => studioCtx.setShowInlineAddDrawer(true))
        }
        data-event="add-button-inlined"
      >
        <Icon icon={PlusIcon} />
      </button>
    </>
  ) : null;
}

export const InlineAddButton = observer(_InlineAddButton);
function _InlineAddButton(props: {
  elementWidth?: number;
  elementHeight?: number;
  dimensionsBoxWidth?: number;
}) {
  return <NewInlineAddButton {...props} />;
}
