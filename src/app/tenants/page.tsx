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
    property: "Appt 101, 123 Rue Principale",
    status: "Actif",
    leaseEnd: "2024-12-31",
  },
  {
    name: "Jane Smith",
    email: "jane.smith@example.com",
    property: "Unité 5, 456 Avenue du Chêne",
    status: "Actif",
    leaseEnd: "2025-06-30",
  },
  {
    name: "Mike Johnson",
    email: "mike.j@example.com",
    property: "Appt 202, 123 Rue Principale",
    status: "Partant",
    leaseEnd: "2024-08-31",
  },
  {
    name: "Sarah Williams",
    email: "sarah.w@example.com",
    property: "Maison, 789 Allée des Pins",
    status: "En retard",
    leaseEnd: "2025-01-31",
  },
    {
    name: "David Brown",
    email: "david.b@example.com",
    property: "Condo 3, 321 Cour des Ormes",
    status: "Actif",
    leaseEnd: "2024-11-30",
  },
];

export default function TenantsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Locataires">
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          Ajouter un locataire
        </Button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Gestion des locataires</CardTitle>
            <CardDescription>
              Consultez, ajoutez et gérez vos locataires.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden md:table-cell">Propriété</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Fin du bail</TableHead>
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
                      <Badge variant={tenant.status === 'Actif' ? 'secondary' : tenant.status === 'En retard' ? 'destructive' : 'outline'}>{tenant.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{tenant.leaseEnd}</TableCell>
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
                          <DropdownMenuItem>Voir les détails</DropdownMenuItem>
                          <DropdownMenuItem>Envoyer un message</DropdownMenuItem>
                          <DropdownMenuItem>Modifier</DropdownMenuItem>
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
