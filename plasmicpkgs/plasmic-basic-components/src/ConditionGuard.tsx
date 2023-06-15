import registerComponent, {
  ComponentMeta,
} from "@plasmicapp/host/registerComponent";
import React from "react";

export interface ConditionGuardProps {
  condition: boolean;
  onNotSatisfied?: () => Promise<void>;
  children: React.ReactNode;
  skipPaths: Array<{ path: string }>;
}

function ConditionGuardOnNotSatisfied({
  onNotSatisfied,
}: Pick<ConditionGuardProps, "onNotSatisfied">) {
  const ref = React.useRef(false);
  React.useEffect(() => {
    if (!ref.current) {
      ref.current = true;
      onNotSatisfied?.();
    }
  }, [onNotSatisfied]);
  return null;
}

function isCurrentLocationInSkipPaths(skipPaths: Array<{ path: string }>) {
  const pathname = window.location.pathname;
  // Ignore search params
  const currentPath = window.location.origin + pathname;
  return skipPaths.some(
    ({ path }) => path === pathname || path === currentPath
  );
}

export default function ConditionGuard({
  condition,
  onNotSatisfied,
  children,
  skipPaths,
}: ConditionGuardProps) {
  if (!condition && !isCurrentLocationInSkipPaths(skipPaths)) {
    return <ConditionGuardOnNotSatisfied onNotSatisfied={onNotSatisfied} />;
  }

  return <>{children}</>;
}

export const conditionGuardMeta: ComponentMeta<ConditionGuardProps> = {
  name: "hostless-condition-guard",
  displayName: "Condition Guard",
  importName: "ConditionGuard",
  importPath: "@plasmicpkgs/plasmic-basic-components",
  props: {
    children: "slot",
    condition: {
      type: "boolean",
      displayName: "Condition",
      description: "The condition to guard against",
      defaultValue: true,
    },
    onNotSatisfied: {
      type: "eventHandler",
      displayName: "On not satisfied",
      description: "The action to run when the condition is not satisfied",
      argTypes: [],
    },
    skipPaths: {
      type: "array",
      displayName: "Skip Paths",
      description: "Paths that the action should not run",
      itemType: {
        type: "object",
        fields: {
          path: "href",
        },
        nameFunc: (item: any) => item?.path,
      },
    },
  },
};

export function registerConditionGuard(
  loader?: { registerComponent: typeof registerComponent },
  customConditionGuardMeta?: ComponentMeta<ConditionGuardProps>
) {
  if (loader) {
    loader.registerComponent(
      ConditionGuard,
      customConditionGuardMeta ?? conditionGuardMeta
    );
  } else {
    registerComponent(
      ConditionGuard,
      customConditionGuardMeta ?? conditionGuardMeta
    );
  }
}
