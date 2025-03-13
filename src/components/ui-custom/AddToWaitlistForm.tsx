
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addToWaitlist } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const formSchema = z.object({
  email_address: z.string().email('Please enter a valid email address'),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  wallet_address: z.string().min(5, 'Please enter a valid wallet address'),
});

type FormValues = z.infer<typeof formSchema>;

interface AddToWaitlistFormProps {
  onSuccess?: () => void;
}

const AddToWaitlistForm: React.FC<AddToWaitlistFormProps> = ({ onSuccess }) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email_address: '',
      first_name: '',
      last_name: '',
      country: '',
      wallet_address: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    // Explicitly cast the data to match the required type
    const waitlistData = {
      email_address: data.email_address,
      first_name: data.first_name,
      last_name: data.last_name,
      country: data.country,
      wallet_address: data.wallet_address,
    };
    
    const result = await addToWaitlist(waitlistData);
    if (result) {
      form.reset();
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="First name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="email_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input placeholder="Country" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="wallet_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wallet Address</FormLabel>
              <FormControl>
                <Input placeholder="Solana wallet address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full bg-green-500/80 hover:bg-green-500 text-black font-semibold"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Adding...' : 'Add to Waitlist'}
        </Button>
      </form>
    </Form>
  );
};

export default AddToWaitlistForm;
