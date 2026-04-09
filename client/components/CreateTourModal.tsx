import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Plus, Trash2 } from "lucide-react";

interface Building {
  id?: string;
  name: string;
  short_name?: string;
  category: string;
  description: string;
  history?: string;
  academic_depts?: string[];
  facilities?: string[];
  student_capacity?: number;
  year_built?: number;
  coordinates: { lat: number; lng: number };
  image_url: string;
  image_gallery?: string[];
  panorama_url?: string;
}

interface CreateTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (building: Building) => Promise<void>;
  userLocation?: { lat: number; lng: number };
}

export default function CreateTourModal({ open, onOpenChange, onCreate, userLocation }: CreateTourModalProps) {
  const [formData, setFormData] = useState<Building>({
    name: "",
    short_name: "",
    category: "landmark",
    description: "",
    history: "",
    academic_depts: [],
    facilities: [],
    image_url: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=400",
    image_gallery: [],
    panorama_url: "",
    coordinates: userLocation || { lat: 5.1300, lng: 7.3000 },
    student_capacity: undefined,
    year_built: undefined
  });

  const [isCreating, setIsCreating] = useState(false);
  const [newDept, setNewDept] = useState("");
  const [newFacility, setNewFacility] = useState("");

  const handleChange = (field: keyof Building, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCoordinateChange = (field: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      coordinates: {
        ...prev.coordinates,
        [field]: numValue
      }
    }));
  };

  const addDepartment = () => {
    if (newDept.trim()) {
      setFormData(prev => ({
        ...prev,
        academic_depts: [...(prev.academic_depts || []), newDept.trim()]
      }));
      setNewDept("");
    }
  };

  const removeDepartment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      academic_depts: (prev.academic_depts || []).filter((_, i) => i !== index)
    }));
  };

  const addFacility = () => {
    if (newFacility.trim()) {
      setFormData(prev => ({
        ...prev,
        facilities: [...(prev.facilities || []), newFacility.trim()]
      }));
      setNewFacility("");
    }
  };

  const removeFacility = (index: number) => {
    setFormData(prev => ({
      ...prev,
      facilities: (prev.facilities || []).filter((_, i) => i !== index)
    }));
  };

  const addImageUrl = () => {
    const url = prompt("Enter image URL:");
    if (url?.trim()) {
      setFormData(prev => ({
        ...prev,
        image_gallery: [...(prev.image_gallery || []), url.trim()]
      }));
    }
  };

  const removeImageUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      image_gallery: (prev.image_gallery || []).filter((_, i) => i !== index)
    }));
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a location name");
      return;
    }

    if (!formData.description.trim()) {
      alert("Please enter a description");
      return;
    }

    setIsCreating(true);
    try {
      await onCreate(formData);
      onOpenChange(false);
      // Reset form
      setFormData({
        name: "",
        short_name: "",
        category: "landmark",
        description: "",
        history: "",
        academic_depts: [],
        facilities: [],
        image_url: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=400",
        image_gallery: [],
        panorama_url: "",
        coordinates: userLocation || { lat: 5.1300, lng: 7.3000 },
        student_capacity: undefined,
        year_built: undefined
      });
    } catch (error) {
      console.error("Failed to create tour:", error);
      alert("Failed to create tour. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-2xl font-bold">Create New Tour Location</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Location Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g., Main Library, Science Lab"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Short Name</label>
                  <Input
                    value={formData.short_name || ""}
                    onChange={(e) => handleChange("short_name", e.target.value)}
                    placeholder="e.g., ML, SL"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="school">School/Academic</option>
                  <option value="admin">Administration</option>
                  <option value="facility">Facility</option>
                  <option value="landmark">Landmark</option>
                  <option value="venue">Venue</option>
                  <option value="hostel">Hostel</option>
                </select>
              </div>
            </div>

            {/* Description & History */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Content</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe this location - what makes it special?"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">History/Context</label>
                <textarea
                  value={formData.history || ""}
                  onChange={(e) => handleChange("history", e.target.value)}
                  placeholder="Tell the story of this place"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Images & Media */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Images & Media</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">Main Image URL</label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => handleChange("image_url", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Panorama URL (360° View)</label>
                <Input
                  value={formData.panorama_url || ""}
                  onChange={(e) => handleChange("panorama_url", e.target.value)}
                  placeholder="https://example.com/panorama.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Additional Photos</label>
                <div className="space-y-2">
                  {(formData.image_gallery || []).map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => {
                          const newGallery = [...(formData.image_gallery || [])];
                          newGallery[idx] = e.target.value;
                          handleChange("image_gallery", newGallery);
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                      <button
                        onClick={() => removeImageUrl(idx)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addImageUrl}
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Photo
                  </Button>
                </div>
              </div>
            </div>

            {/* Departments */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Associated Departments</h3>
              <div className="space-y-2">
                {(formData.academic_depts || []).map((dept, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                    <span className="flex-1 text-sm font-medium">{dept}</span>
                    <button
                      onClick={() => removeDepartment(idx)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addDepartment()}
                    placeholder="Add department..."
                  />
                  <Button onClick={addDepartment} variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Facilities */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Facilities Available</h3>
              <div className="space-y-2">
                {(formData.facilities || []).map((facility, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                    <span className="flex-1 text-sm font-medium">{facility}</span>
                    <button
                      onClick={() => removeFacility(idx)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newFacility}
                    onChange={(e) => setNewFacility(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addFacility()}
                    placeholder="e.g., WiFi, Parking, Cafeteria"
                  />
                  <Button onClick={addFacility} variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Additional Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Year Built</label>
                  <Input
                    type="number"
                    value={formData.year_built || ""}
                    onChange={(e) => handleChange("year_built", e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="e.g., 2015"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Capacity</label>
                  <Input
                    type="number"
                    value={formData.student_capacity || ""}
                    onChange={(e) => handleChange("student_capacity", e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="e.g., 500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Latitude</label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.coordinates.lat}
                    onChange={(e) => handleCoordinateChange("lat", e.target.value)}
                    placeholder="e.g., 5.1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Longitude</label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.coordinates.lng}
                    onChange={(e) => handleCoordinateChange("lng", e.target.value)}
                    placeholder="e.g., 7.5678"
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white rounded-b-2xl">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="flex-1"
          >
            {isCreating ? "Creating..." : "Create Tour Location"}
          </Button>
        </div>
      </div>
    </div>
  );
}
