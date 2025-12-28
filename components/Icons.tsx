import React from 'react';
import {
  Plus,
  Trash2,
  Download,
  Edit,
  Eye,
  Check,
  Upload,
  BarChart2,
  Save,
  Share2,
  Box,
  Scissors,
  Ruler, // TapeMeasure equivalent
  DraftingCompass, // Needle equivalent or custom
  Shirt, // Hanger equivalent
  Tag
} from 'lucide-react-native';

interface IconProps {
  color?: string;
  size?: number;
  strokeWidth?: number;
}

// These are now native components that work perfectly with styles
export const PlusIcon = ({ color = "currentColor", size = 20 }: IconProps) => (
  <Plus color={color} size={size} />
);

export const TrashIcon = ({ color = "currentColor", size = 18 }: IconProps) => (
  <Trash2 color={color} size={size} />
);

export const DownloadIcon = ({ color = "currentColor", size = 20 }: IconProps) => (
  <Download color={color} size={size} />
);

export const EditIcon = ({ color = "currentColor", size = 20 }: IconProps) => (
  <Edit color={color} size={size} />
);

export const EyeIcon = ({ color = "currentColor", size = 20 }: IconProps) => (
  <Eye color={color} size={size} />
);

export const CheckIcon = ({ color = "currentColor", size = 20 }: IconProps) => (
  <Check color={color} size={size} />
);

export const UploadIcon = ({ color = "currentColor", size = 20 }: IconProps) => (
  <Upload color={color} size={size} />
);

export const ChartIcon = ({ color = "currentColor", size = 20 }: IconProps) => (
  <BarChart2 color={color} size={size} />
);

export const SaveIcon = ({ color = "currentColor", size = 20 }: IconProps) => (
  <Save color={color} size={size} />
);

export const ShareIcon = ({ color = "currentColor", size = 20 }: IconProps) => (
  <Share2 color={color} size={size} />
);

export const BoxIcon = ({ color = "currentColor", size = 20 }: IconProps) => (
  <Box color={color} size={size} />
);

export const ScissorsIcon = ({ color = "currentColor", size = 20 }: IconProps) => (
  <Scissors color={color} size={size} />
);

export const TapeMeasureIcon = ({ color = "currentColor", size = 20 }: IconProps) => (
  <Ruler color={color} size={size} />
);

export const NeedleIcon = ({ color = "currentColor", size = 20 }: IconProps) => (
  <DraftingCompass color={color} size={size} />
);

export const HangerIcon = ({ color = "currentColor", size = 20 }: IconProps) => (
  <Shirt color={color} size={size} />
);

export const TagIcon = ({ color = "currentColor", size = 20 }: IconProps) => (
  <Tag color={color} size={size} />
);