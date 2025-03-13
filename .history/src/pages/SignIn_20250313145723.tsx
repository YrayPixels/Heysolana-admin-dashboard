
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Volume2 } from 'lucide-react';
import AnimatedText from '@/components/ui-custom/AnimatedText';
import { toast } from 'sonner';
import Logo from '../../public/logo.png';

const SignIn: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await login(username, password);
      
      if (!success) {
        toast.error('Invalid credentials. Try admin/password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-noise p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-solana/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 bg-purple-700/10 blur-[100px] rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="glass-card p-8 w-full max-w-md z-10">
        <div className="flex flex-col items-center space-y-2 mb-8">
          <div className="h-12 w-12 rounded-full bg-solana/10 flex items-center justify-center">
            <img src={Logo} />
          </div>
          <h1 className="text-2xl font-bold mt-4">
            <AnimatedText gradient>UseHeySolana Admin</AnimatedText>
          </h1>
          <p className="text-muted-foreground text-center mt-1">
            <AnimatedText delay={200}>Sign in to manage your AI-powered voice transaction platform</AnimatedText>
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-black/30 border-white/10"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a href="#" className="text-xs text-solana hover:text-solana/80 transition-colors">
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/30 border-white/10"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-solana to-purple-600 hover:opacity-90 transition-opacity"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Default credentials: admin / password</p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
