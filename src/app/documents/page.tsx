import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, Upload, FileText, FileSpreadsheet, FileImage } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const documents = [
  {
    name: "Lease-Apt-101.pdf",
    type: "Lease Agreement",
    size: "1.2 MB",
    uploaded: "2024-01-15",
    icon: <FileText className="h-5 w-5 text-muted-foreground" />,
  },
  {
    name: "Tenant-Info-2024.xlsx",
    type: "Spreadsheet",
    size: "450 KB",
    uploaded: "2024-02-01",
    icon: <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />,
  },
  {
    name: "Property-Inspection-Unit5.jpg",
    type: "Image",
    size: "4.5 MB",
    uploaded: "2024-07-10",
    icon: <FileImage className="h-5 w-5 text-muted-foreground" />,
  },
  {
    name: "Notice-of-Entry.pdf",
    type: "Notice",
    size: "300 KB",
    uploaded: "2024-07-20",
    icon: <FileText className="h-5 w-5 text-muted-foreground" />,
  },
  {
    name: "Rent-Receipt-Q2.pdf",
    type: "Receipt",
    size: "250 KB",
    uploaded: "2024-07-05",
    icon: <FileText className="h-5 w-5 text-muted-foreground" />,
  },
];

export default function DocumentsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Documents">
        <Button size="sm" className="gap-1">
          <Upload className="h-3.5 w-3.5" />
          Upload Document
        </Button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Document Storage</CardTitle>
            <CardDescription>
              Securely store and manage all your important documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.name}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {doc.icon}
                        <span className="font-medium">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{doc.type}</TableCell>
                    <TableCell className="hidden sm:table-cell">{doc.size}</TableCell>
                    <TableCell>{doc.uploaded}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Download</DropdownMenuItem>
                          <DropdownMenuItem>Share</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
