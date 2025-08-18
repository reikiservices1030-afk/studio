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
import { MoreHorizontal, PlusCircle, Bell, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const reminders = [
  {
    tenant: "John Doe",
    property: "Apt 101, 123 Main St",
    dueDate: "2024-08-01",
    amount: 1200,
    status: "Sent",
  },
  {
    tenant: "Jane Smith",
    property: "Unit 5, 456 Oak Ave",
    dueDate: "2024-08-01",
    amount: 1500,
    status: "Sent",
  },
  {
    tenant: "Mike Johnson",
    property: "Apt 202, 123 Main St",
    dueDate: "2024-08-01",
    amount: 1250,
    status: "Pending",
  },
  {
    tenant: "Sarah Williams",
    property: "House, 789 Pine Ln",
    dueDate: "2024-08-01",
    amount: 2500,
    status: "Scheduled",
  },
  {
    tenant: "David Brown",
    property: "Condo 3, 321 Elm Ct",
    dueDate: "2024-09-01",
    amount: 1800,
    status: "Scheduled",
  },
];

export default function RemindersPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Rent Reminders">
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          New Reminder
        </Button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Automated Reminders</CardTitle>
            <CardDescription>
              Manage and track automated rent reminders sent to tenants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="hidden md:table-cell">Property</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((reminder) => (
                  <TableRow key={reminder.tenant}>
                    <TableCell className="font-medium">{reminder.tenant}</TableCell>
                    <TableCell className="hidden md:table-cell">{reminder.property}</TableCell>
                    <TableCell>{reminder.dueDate}</TableCell>
                    <TableCell className="hidden sm:table-cell">${reminder.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={reminder.status === 'Sent' ? 'default' : reminder.status === 'Pending' ? 'destructive' : 'secondary'}>{reminder.status}</Badge>
                    </TableCell>
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
                          <DropdownMenuItem disabled={reminder.status !== 'Pending'}>
                            <Send className="mr-2 h-4 w-4" />
                            Send Now
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Bell className="mr-2 h-4 w-4" />
                            View Schedule
                          </DropdownMenuItem>
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
