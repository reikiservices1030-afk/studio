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
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const tenants = [
  {
    name: "John Doe",
    email: "john.doe@example.com",
    property: "Apt 101, 123 Main St",
    status: "Active",
    leaseEnd: "2024-12-31",
  },
  {
    name: "Jane Smith",
    email: "jane.smith@example.com",
    property: "Unit 5, 456 Oak Ave",
    status: "Active",
    leaseEnd: "2025-06-30",
  },
  {
    name: "Mike Johnson",
    email: "mike.j@example.com",
    property: "Apt 202, 123 Main St",
    status: "Moving Out",
    leaseEnd: "2024-08-31",
  },
  {
    name: "Sarah Williams",
    email: "sarah.w@example.com",
    property: "House, 789 Pine Ln",
    status: "Overdue",
    leaseEnd: "2025-01-31",
  },
    {
    name: "David Brown",
    email: "david.b@example.com",
    property: "Condo 3, 321 Elm Ct",
    status: "Active",
    leaseEnd: "2024-11-30",
  },
];

export default function TenantsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Tenants">
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          Add Tenant
        </Button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Tenant Management</CardTitle>
            <CardDescription>
              View, add, and manage your tenants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Property</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Lease End Date</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.email}>
                    <TableCell>
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-sm text-muted-foreground">{tenant.email}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{tenant.property}</TableCell>
                    <TableCell>
                      <Badge variant={tenant.status === 'Active' ? 'secondary' : tenant.status === 'Overdue' ? 'destructive' : 'outline'}>{tenant.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{tenant.leaseEnd}</TableCell>
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
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Send Message</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
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
