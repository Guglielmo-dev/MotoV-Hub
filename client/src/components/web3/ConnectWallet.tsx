import { useState } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConnectWalletProps {
  onConnect?: (address: string) => void;
  connectedAddress?: string;
}

export function ConnectWallet({ onConnect, connectedAddress }: ConnectWalletProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(connectedAddress || null);
  const { toast } = useToast();

  const connect = async () => {
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask extension to link NFTs.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        if (onConnect) onConnect(accounts[0]);
        toast({ title: "Wallet Connected", description: `Connected to ${accounts[0].slice(0,6)}...${accounts[0].slice(-4)}` });
      }
    } catch (err: any) {
      toast({
        title: "Connection Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  if (address) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-secondary rounded-xl border border-white/10">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-mono text-muted-foreground">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
    );
  }

  return (
    <Button 
      onClick={connect} 
      disabled={isConnecting}
      variant="outline"
      className="bg-card hover:bg-secondary border-primary/20 text-primary hover:text-primary transition-all duration-300"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
