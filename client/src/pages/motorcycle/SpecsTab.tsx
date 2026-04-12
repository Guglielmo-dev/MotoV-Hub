import { format } from "date-fns";
import { ShieldAlert } from "lucide-react";

interface SpecsTabProps {
  bike: any;
}

export function SpecsTab({ bike }: SpecsTabProps) {
  return (
    <div className="bg-card/80 backdrop-blur-md rounded-2xl p-6 sm:p-10 space-y-8">
      <h3 className="text-2xl font-bold font-display border-b border-white/5 pb-4">Specifications</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
        <div><dt className="text-sm text-muted-foreground mb-1">Brand</dt><dd className="font-medium text-lg">{bike.brand}</dd></div>
        <div><dt className="text-sm text-muted-foreground mb-1">Model</dt><dd className="font-medium text-lg">{bike.model}</dd></div>
        <div><dt className="text-sm text-muted-foreground mb-1">Year</dt><dd className="font-medium text-lg">{bike.year}</dd></div>
        <div><dt className="text-sm text-muted-foreground mb-1">Engine Size</dt><dd className="font-medium text-lg">{bike.engineSize}cc</dd></div>
        <div><dt className="text-sm text-muted-foreground mb-1">Current Mileage</dt><dd className="font-medium text-lg">{bike.mileage?.toLocaleString()} mi</dd></div>
        {bike.initialMileage !== null && <div><dt className="text-sm text-muted-foreground mb-1">Initial Mileage (from registration)</dt><dd className="font-medium text-lg">{bike.initialMileage?.toLocaleString()} mi</dd></div>}
        <div><dt className="text-sm text-muted-foreground mb-1">Added to Garage</dt><dd className="font-medium text-lg">{bike.createdAt ? format(new Date(bike.createdAt), 'MMMM yyyy') : 'Unknown'}</dd></div>
      </dl>

      {bike.nftContractAddress && (
        <div className="mt-8 p-6 bg-secondary/50 rounded-xl border border-primary/20">
          <h4 className="flex items-center gap-2 font-bold text-primary mb-2"><ShieldAlert className="w-5 h-5"/> Digital Ownership Verified</h4>
          <p className="text-sm text-muted-foreground font-mono break-all">Contract: {bike.nftContractAddress}</p>
        </div>
      )}
    </div>
  );
}
