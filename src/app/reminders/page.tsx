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
    property: "Appt 101, 123 Rue Principale",
    dueDate: "2024-08-01",
    amount: 1200,
    status: "Envoyé",
  },
  {
    tenant: "Jane Smith",
    property: "Unité 5, 456 Avenue du Chêne",
    dueDate: "2024-08-01",
    amount: 1500,
    status: "Envoyé",
  },
  {
    tenant: "Mike Johnson",
    property: "Appt 202, 123 Rue Principale",
    dueDate: "2024-08-01",
    amount: 1250,
    status: "En attente",
  },
  {
    tenant: "Sarah Williams",
    property: "Maison, 789 Allée des Pins",
    dueDate: "2024-08-01",
    amount: 2500,
    status: "Programmé",
  },
  {
    tenant: "David Brown",
    property: "Condo 3, 321 Cour des Ormes",
    dueDate: "2024-09-01",
    amount: 1800,
    status: "Programmé",
  },
];

export default function RemindersPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Rappels de loyer">
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          Nouveau rappel
        </Button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Rappels automatisés</CardTitle>
            <CardDescription>
              Gérez et suivez les rappels de loyer automatisés envoyés aux locataires.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Locataire</TableHead>
                  <TableHead className="hidden md:table-cell">Propriété</TableHead>
                  <TableHead>Date d'échéance</TableHead>
                  <TableHead className="hidden sm:table-cell">Montant</TableHead>
                  <TableHead>Statut</TableHead>
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
                      <Badge variant={reminder.status === 'Envoyé' ? 'default' : reminder.status === 'En attente' ? 'destructive' : 'secondary'}>{reminder.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem disabled={reminder.status !== 'En attente'}>
                            <Send className="mr-2 h-4 w-4" />
                            Envoyer maintenant
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Bell className="mr-2 h-4 w-4" />
                            Voir le calendrier
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
