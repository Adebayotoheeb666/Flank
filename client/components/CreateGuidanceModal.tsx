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
import { useToast } from "@/hooks/use-toast";
import { useUserId } from "@/hooks/use-auth";
import { Loader2, X } from "lucide-react";

interface CreateGuidanceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export default function CreateGuidanceModal({
    open,
    onOpenChange,
    onSuccess,
}: CreateGuidanceModalProps) {
    const { toast } = useToast();
    const userId = useUserId();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        instruction: "",
        landmark: "",
        action: "",
        distance: "",
        tips: [""],
    });

    const handleAddTip = () => {
        setFormData({
            ...formData,
            tips: [...formData.tips, ""],
        });
    };

    const handleRemoveTip = (index: number) => {
        setFormData({
            ...formData,
            tips: formData.tips.filter((_, i) => i !== index),
        });
    };

    const handleTipChange = (index: number, value: string) => {
        const newTips = [...formData.tips];
        newTips[index] = value;
        setFormData({
            ...formData,
            tips: newTips,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.instruction.trim()) {
            toast({
                title: "Error",
                description: "Instruction is required.",
                variant: "destructive",
            });
            return;
        }

        if (!formData.landmark.trim()) {
            toast({
                title: "Error",
                description: "Landmark is required.",
                variant: "destructive",
            });
            return;
        }

        try {
            setSubmitting(true);
            const response = await fetch("/api/guidance", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    instruction: formData.instruction,
                    landmark: formData.landmark,
                    action: formData.action,
                    distance: formData.distance,
                    tips: formData.tips.filter(tip => tip.trim()),
                    creator_id: userId,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create guidance step");
            }

            toast({
                title: "Success",
                description: "Guidance step created successfully!",
            });

            onOpenChange(false);
            if (onSuccess) onSuccess();

            // Reset form
            setFormData({
                instruction: "",
                landmark: "",
                action: "",
                distance: "",
                tips: [""],
            });
        } catch (error) {
            console.error("Error creating guidance step:", error);
            toast({
                title: "Error",
                description: "Failed to create guidance step. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Guidance Step</DialogTitle>
                    <DialogDescription>
                        Add a new step to guide freshers through campus.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="instruction">Instruction *</Label>
                        <Input
                            id="instruction"
                            placeholder="e.g. Head towards the Main Gate"
                            value={formData.instruction}
                            onChange={(e) => setFormData({ ...formData, instruction: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="landmark">Landmark *</Label>
                        <Input
                            id="landmark"
                            placeholder="e.g. Main Gate, Library Building"
                            value={formData.landmark}
                            onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="action">Action</Label>
                        <Input
                            id="action"
                            placeholder="e.g. Turn left at the intersection"
                            value={formData.action}
                            onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="distance">Distance to Next Landmark</Label>
                        <Input
                            id="distance"
                            placeholder="e.g. 200 meters"
                            value={formData.distance}
                            onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Tips (optional)</Label>
                        <div className="space-y-2">
                            {formData.tips.map((tip, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        placeholder="e.g. Look for the red sign"
                                        value={tip}
                                        onChange={(e) => handleTipChange(index, e.target.value)}
                                    />
                                    {formData.tips.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveTip(index)}
                                            className="shrink-0"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddTip}
                            className="mt-2"
                        >
                            + Add Tip
                        </Button>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={submitting} className="w-full">
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Step...
                                </>
                            ) : (
                                "Create Guidance Step"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
