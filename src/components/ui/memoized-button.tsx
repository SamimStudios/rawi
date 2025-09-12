import * as React from "react";
import { Button, ButtonProps } from "./button";

// Memoized Button component to prevent unnecessary re-renders and credit blinking
const MemoizedButton = React.memo<ButtonProps>(
  ({ functionId, ...props }) => {
    return <Button functionId={functionId} {...props} />;
  },
  (prevProps, nextProps) => {
    // Only re-render if functionId, children, or disabled state changes
    return (
      prevProps.functionId === nextProps.functionId &&
      prevProps.children === nextProps.children &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.className === nextProps.className &&
      prevProps.variant === nextProps.variant &&
      prevProps.size === nextProps.size
    );
  }
);

MemoizedButton.displayName = "MemoizedButton";

export { MemoizedButton };