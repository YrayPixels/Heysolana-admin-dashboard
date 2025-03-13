
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Search } from "lucide-react";
import { toast } from "sonner";

interface Column<T> {
  header: string;
  accessorKey: string;
  enableSorting?: boolean;
  cell?: (info: { row: { original: T; index: number }; getValue: () => any }) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
}: DataTableProps<T>) {
  const [searchText, setSearchText] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc" | null;
  }>({ key: null, direction: null });

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";
    
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    
    setSortConfig({ key, direction });
  };

  // Filter data based on search text
  const filteredData = data.filter((row) => {
    return Object.values(row).some((value) => {
      if (typeof value === "string") {
        return value.toLowerCase().includes(searchText.toLowerCase());
      }
      return false;
    });
  });

  // Sort data based on sort config
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortConfig.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortConfig.direction === "asc"
        ? aValue - bValue
        : bValue - aValue;
    }
    
    return 0;
  });

  // Function to get cell value
  const getCellValue = (row: T, column: Column<T>, rowIndex: number) => {
    if (column.cell) {
      return column.cell({
        row: { original: row, index: rowIndex },
        getValue: () => row[column.accessorKey],
      });
    }
    
    return (
      <span className="text-white font-medium">
        {row[column.accessorKey] !== undefined ? String(row[column.accessorKey]) : ""}
      </span>
    );
  };

  return (
    <div className="rounded-md border border-white/10 bg-black/20 backdrop-blur-lg overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 w-64 bg-black/30 border-white/10"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>
      <div className="max-h-[calc(100vh-250px)] overflow-auto scrollbar-none">
        <Table>
          <TableHeader className="sticky top-0 bg-black/50 backdrop-blur-md">
            <TableRow>
              {columns.map((column, i) => (
                <TableHead
                  key={i}
                  className={column.enableSorting ? "cursor-pointer select-none" : ""}
                  onClick={() => {
                    if (column.enableSorting) {
                      handleSort(column.accessorKey);
                    }
                  }}
                >
                  <div className="flex items-center font-bold text-white">
                    {column.header}
                    {sortConfig.key === column.accessorKey && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={onRowClick ? "cursor-pointer hover:bg-white/5" : ""}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className="text-white">
                      {getCellValue(row, column, rowIndex)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right p-0 pr-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-white/5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black/90 border-white/10">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Row data:", row);
                            navigator.clipboard.writeText(JSON.stringify(row, null, 2));
                            toast.success("User details copied to clipboard");
                          }}
                        >
                          Copy details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default DataTable;
