import { useState, useEffect } from "react";
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

interface GuidanceStep {
    id: number;
    instruction: string;
    landmark: string;
    action: string;
    distance: string;
    tips: string[];
    creator_id?: string;
    created_at?: string;
    updated_at?: string;
    step_order?: number;
}

interface EditGuidanceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    step: GuidanceStep | null;
    onSuccess?: () => void;
}

export default function EditGuidanceModal({
    open,
    onOpenChange,
    step,
    onSuccess,
}: EditGuidanceModalProps) {
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

    // Pre-fill form when step changes
    useEffect(() => {
        if (step) {
            setFormData({
                instruction: step.instruction,
                landmark: step.landmark,
                action: step.action,
                distance: step.distance,
                tips: step.tips && step.tips.length > 0 ? step.tips : [""],
            });
        }
    }, [step]);

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

        if (!step) {
            toast({
                title: "Error",
                description: "Step data is missing.",
                variant: "destructive",
            });
            return;
        }

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
            const response = await fetch(`/api/guidance/${step.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    instruction: formData.instruction,
                    landmark: formData.landmark,
                    action: formData.action,
                    distance: formData.distance,
                    tips: formData.tips.filter(tip => tip.trim()),
                    user_id: userId,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update guidance step");
            }

            toast({
                title: "Success",
                description: "Guidance step updated successfully!",
            });

            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error updating guidance step:", error);
            toast({
                title: "Error",
                description: "Failed to update guidance step. Please try again.",
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
                    <DialogTitle>Edit Guidance Step</DialogTitle>
                    <DialogDescription>
                        Update the details of this guidance step.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-instruction">Instruction *</Label>
                        <Input
                            id="edit-instruction"
                            placeholder="e.g. Head towards the Main Gate"
                            value={formData.instruction}
                            onChange={(e) => setFormData({ ...formData, instruction: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-landmark">Landmark *</Label>
                        <Input
                            id="edit-landmark"
                            placeholder="e.g. Main Gate, Library Building"
                            value={formData.landmark}
                            onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-action">Action</Label>
                        <Input
                            id="edit-action"
                            placeholder="e.g. Turn left at the intersection"
                            value={formData.action}
                            onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-distance">Distance to Next Landmark</Label>
                        <Input
                            id="edit-distance"
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
                                    Updating Step...
                                </>
                            ) : (
                                "Update Guidance Step"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
