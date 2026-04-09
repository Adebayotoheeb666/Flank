import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUserId } from "@/hooks/use-auth";
import { MapPin, Loader2 } from "lucide-react";

interface AddPlaceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentLocation?: { lat: number; lng: number };
    onSuccess?: () => void;
}

export default function AddPlaceModal({
    open,
    onOpenChange,
    currentLocation,
    onSuccess,
}: AddPlaceModalProps) {
    const { toast } = useToast();
    const userId = useUserId();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        type: "Building",
        category: "school",
        description: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentLocation) {
            toast({
                title: "Error",
                description: "Could not determine location coordinates.",
                variant: "destructive",
            });
            return;
        }

        try {
            setSubmitting(true);
            const response = await fetch("/api/locations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    coordinates: currentLocation,
                    creator_id: userId,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create location");
            }

            toast({
                title: "Success",
                description: "New place added successfully!",
            });

            onOpenChange(false);
            if (onSuccess) onSuccess();

            // Reset form
            setFormData({
                name: "",
                type: "Building",
                category: "school",
                description: "",
            });
        } catch (error) {
            console.error("Error creating location:", error);
            toast({
                title: "Error",
                description: "Failed to add new place. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Place</DialogTitle>
                    <DialogDescription>
                        Share a new location on campus. This will be visible to all users.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Place Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. ETF Building, Sub Bus Stop"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Building">Building</SelectItem>
                                    <SelectItem value="Lecture Theater">Lecture Theater</SelectItem>
                                    <SelectItem value="Laboratory">Laboratory</SelectItem>
                                    <SelectItem value="Hostel">Hostel</SelectItem>
                                    <SelectItem value="Gate">Gate</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="school">School</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="food">Food</SelectItem>
                                    <SelectItem value="bank">Bank</SelectItem>
                                    <SelectItem value="health">Health</SelectItem>
                                    <SelectItem value="landmark">Landmark</SelectItem>
                                    <SelectItem value="study">Study</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Briefly describe what this place is..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>
                            Coordinates: {currentLocation?.lat.toFixed(6)}, {currentLocation?.lng.toFixed(6)}
                        </span>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={submitting} className="w-full">
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding Place...
                                </>
                            ) : (
                                "Add Place"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
