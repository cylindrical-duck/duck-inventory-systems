import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, Mail, MapPin } from "lucide-react";
import { Customer } from "@/pages/Customers"; // Import the new interface
import { useBranding } from "../context/BrandingContext";

interface CustomerStatsProps {
    customers: Customer[];
}

const CustomerStats = ({ customers }: CustomerStatsProps) => {
    const { primaryColor, accentColor } = useBranding();

    const totalCustomers = customers.length;
    const withEmail = customers.filter((c) => !!c.email).length;
    const withPhone = customers.filter((c) => !!c.phone).length;
    const withAddress = customers.filter((c) => !!c.address).length;

    const stats = [
        {
            title: "Total Customers",
            value: totalCustomers,
            icon: Users,
        },
        {
            title: "With Email",
            value: withEmail,
            icon: Mail,
        },
        {
            title: "With Phone",
            value: withPhone,
            icon: UserPlus, // Using UserPlus as a stand-in for phone
        },
        {
            title: "With Address",
            value: withAddress,
            icon: MapPin,
        },
    ];

    const mainColors = [primaryColor, accentColor, primaryColor, accentColor];
    const gradients = [
        `linear-gradient(to br, ${primaryColor}, ${accentColor})`,
        `linear-gradient(to br, ${accentColor}, ${primaryColor})`,
        `linear-gradient(to br, ${primaryColor}, ${accentColor})`,
        `linear-gradient(to br, ${accentColor}, ${primaryColor})`,
    ];


    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <Card
                    key={stat.title}
                    className="relative overflow-hidden border-primary/20 bg-card/50 backdrop-blur transition-all hover:shadow-lg hover:shadow-primary/20 hover:scale-105"
                    style={{ borderColor: `${mainColors[index]}` }}
                >
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </p>
                                <p
                                    className="text-3xl font-bold mt-2 bg-gradient-to-r bg-clip-text text-transparent"
                                    style={{
                                        backgroundImage: `linear-gradient(to right, hsl(var(--foreground)), ${mainColors[index]})`,
                                    }}
                                >
                                    {stat.value}
                                </p>
                            </div>
                            <div
                                className="p-3 rounded-lg"
                                style={{ background: gradients[index], opacity: 0.1 }}
                            >
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>
                        <div
                            className="absolute bottom-0 left-0 h-1 w-full"
                            style={{ background: gradients[index] }}
                        />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default CustomerStats;