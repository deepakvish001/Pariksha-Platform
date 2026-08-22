import { motion } from "framer-motion";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const folderColors = [
  { id: "primary", label: "Orange", class: "bg-primary" },
  { id: "emerald", label: "Emerald", class: "bg-emerald-500" },
  { id: "amber", label: "Amber", class: "bg-amber-500" },
  { id: "red", label: "Red", class: "bg-rose-500" },
  { id: "purple", label: "Purple", class: "bg-purple-500" },
  { id: "pink", label: "Pink", class: "bg-pink-500" },
  { id: "blue", label: "Blue", class: "bg-blue-500" },
  { id: "cyan", label: "Cyan", class: "bg-cyan-500" },
];

interface FolderColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  disabled?: boolean;
}

const FolderColorPicker = ({ currentColor, onColorChange, disabled }: FolderColorPickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label="Change folder color"
          className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/[0.05]"
          onClick={(e) => e.stopPropagation()}
        >
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-3 bg-black/90 border-white/10 backdrop-blur-xl"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <p className="text-xs font-medium text-white/60 mb-3">Choose folder color</p>
          <div className="grid grid-cols-4 gap-2">
            {folderColors.map((color) => (
              <motion.button
                key={color.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onColorChange(color.id)}
                className={cn(
                  "relative h-8 w-8 rounded-lg transition-all",
                  color.class,
                  currentColor === color.id && "ring-2 ring-white ring-offset-2 ring-offset-black"
                )}
                title={color.label}
              >
                {currentColor === color.id && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FolderColorPicker;
