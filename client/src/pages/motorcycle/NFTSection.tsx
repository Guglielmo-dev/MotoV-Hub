import { ShieldAlert } from "lucide-react";
import { ConnectWallet } from "@/components/web3/ConnectWallet";

interface NFTSectionProps {
  nftContractAddress?: string | null;
  onConnect: (address: string) => void;
}

export function NFTSection({ nftContractAddress, onConnect }: NFTSectionProps) {
  return (
    <div className="flex items-center gap-4">
      <ConnectWallet onConnect={onConnect} connectedAddress={nftContractAddress || undefined} />
      
      {nftContractAddress && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl">
          <ShieldAlert className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">NFT Secured</span>
        </div>
      )}
    </div>
  );
}
