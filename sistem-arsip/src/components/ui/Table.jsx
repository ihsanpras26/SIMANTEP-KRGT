import React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "../../lib/cn";
const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="table-scroll">
    <table ref={ref} className={cn("data-table", className)} {...props} />
  </div>
));
const TableHeader = React.forwardRef((props, ref) => (
  <thead ref={ref} {...props} />
));
const TableBody = React.forwardRef((props, ref) => (
  <tbody ref={ref} {...props} />
));
const TableFooter = React.forwardRef((props, ref) => (
  <tfoot ref={ref} {...props} />
));
const TableRow = React.forwardRef((props, ref) => <tr ref={ref} {...props} />);
const TableHead = React.forwardRef(
  ({ sortable = false, sortDirection, onSort, children, ...props }, ref) => {
    const Icon =
      sortDirection === "asc"
        ? ArrowUp
        : sortDirection === "desc"
          ? ArrowDown
          : ArrowUpDown;
    return (
      <th
        ref={ref}
        scope="col"
        aria-sort={
          sortable
            ? sortDirection === "asc"
              ? "ascending"
              : sortDirection === "desc"
                ? "descending"
                : "none"
            : undefined
        }
        {...props}
      >
        {sortable ? (
          <button
            type="button"
            className="table-sort"
            onClick={() => onSort?.(sortDirection === "asc" ? "desc" : "asc")}
          >
            {children}
            <Icon size={13} aria-hidden="true" />
          </button>
        ) : (
          children
        )}
      </th>
    );
  },
);
const TableCell = React.forwardRef((props, ref) => <td ref={ref} {...props} />);
const TableCaption = React.forwardRef((props, ref) => (
  <caption ref={ref} {...props} />
));
Table.displayName = "Table";
TableHeader.displayName = "TableHeader";
TableBody.displayName = "TableBody";
TableFooter.displayName = "TableFooter";
TableRow.displayName = "TableRow";
TableHead.displayName = "TableHead";
TableCell.displayName = "TableCell";
TableCaption.displayName = "TableCaption";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
