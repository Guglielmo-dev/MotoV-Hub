import { useState } from "react";
import { useRegister } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Bike, ArrowRight } from "lucide-react";
import { playMotorcycleRevSound } from "@/lib/sound";

export function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: register, isPending } = useRegister();
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register({ username, password }, {
      onSuccess: () => {
        playMotorcycleRevSound();
        setTimeout(() => setLocation("/"), 200);
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side image */}
      <div className="hidden lg:block lg:w-1/2 relative border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-l from-background to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=2070&auto=format&fit=crop"
          alt="Motorcycle in garage"
          className="absolute inset-0 w-full h-full object-cover grayscale-[0.2]"
        />
      </div>

      {/* Right side form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 xl:px-24 z-10">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center gap-3 mb-12 lg:justify-end">
            <h1 className="text-4xl font-bold font-display uppercase tracking-wider">MOTO<span className="text-primary">VAULT</span></h1>
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Bike className="w-7 h-7 text-primary" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2">Start Your Engine</h2>
          <p className="text-muted-foreground mb-8">Create an account to manage your motorcycle collection and maintenance.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-card border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Choose a unique username"
                required
                minLength={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-card border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isPending ? "Creating Profile..." : "Create Account"}
              {!isPending && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            Already a member?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
