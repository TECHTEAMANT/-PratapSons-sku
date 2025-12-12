import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SKUSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  sku: string;
}

export default function SKUSuccessModal({ isOpen, onClose, sku }: SKUSuccessModalProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(sku);
    toast.success('SKU copied to clipboard!');
    onClose(); // Automatically close the modal
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-6 h-6" />
            SKU Generated Successfully!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* SKU Display */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-2">Your SKU Code:</p>
            <p className="font-mono text-lg font-bold text-blue-600 break-all">
              {sku}
            </p>
          </div>

          {/* Copy Button */}
          <Button
            onClick={handleCopy}
            className="w-full gap-2"
            size="lg"
          >
            <Copy className="w-4 h-4" />
            Copy SKU Code
          </Button>

          {/* Close Button */}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
