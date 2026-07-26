import PropTypes from "prop-types";
import clsx from "clsx";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/base/Button";
import styles from "./RowActions.module.css";

export const RowActions = ({ actions, testId }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="bare" type="button" data-testid={testId} className={styles.trigger} aria-label="Row actions">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className={styles.content}>
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <DropdownMenuItem
            key={a.label}
            data-testid={a.testId}
            disabled={a.disabled}
            onSelect={() => a.onClick?.()}
            className={clsx(styles.item, a.danger && styles.danger)}
          >
            {Icon && <Icon className="h-4 w-4" />} {a.label}
          </DropdownMenuItem>
        );
      })}
    </DropdownMenuContent>
  </DropdownMenu>
);

RowActions.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
      onClick: PropTypes.func,
      danger: PropTypes.bool,
      disabled: PropTypes.bool,
      testId: PropTypes.string,
    })
  ).isRequired,
  testId: PropTypes.string,
};
