
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import GlassCard from "./GlassCard";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { useAuth } from "../AuthContext";
import { UserProfile } from "@/services/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const profileSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  avatar: z.string().optional(),
});

const ProfileForm: React.FC = () => {
  const { user, updateProfile } = useAuth();
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      fullName: user?.fullName || "",
      avatar: user?.avatar || "",
    },
  });
  
  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    await updateProfile(values as Partial<UserProfile>);
  };
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <GlassCard className="w-full max-w-xl mx-auto animate-fade-up">
      <div className="flex flex-col items-center space-y-4 mb-8">
        <Avatar className="h-24 w-24 border-2 border-white/10">
          <AvatarImage src={user?.avatar} alt={user?.fullName} />
          <AvatarFallback className="bg-solana/20 text-xl">
            {user?.fullName ? getInitials(user.fullName) : "AD"}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold text-gradient-solana">{user?.fullName || "Admin User"}</h2>
        <p className="text-muted-foreground">{user?.username || "admin"}</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="username" className="bg-black/30" {...field} />
                </FormControl>
                <FormDescription>This is your public display name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="email@example.com" className="bg-black/30" {...field} />
                </FormControl>
                <FormDescription>Your contact email address.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Full Name" className="bg-black/30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="avatar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/avatar.jpg" className="bg-black/30" {...field} />
                </FormControl>
                <FormDescription>Enter a URL for your avatar image.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full bg-gradient-to-r from-solana to-purple-600 hover:opacity-90 transition-opacity">
            Update Profile
          </Button>
        </form>
      </Form>
    </GlassCard>
  );
};

export default ProfileForm;
