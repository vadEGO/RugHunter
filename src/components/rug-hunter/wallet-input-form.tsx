
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { useRuggedWallets } from "@/hooks/use-rugged-wallets";
import { PlusCircle } from "lucide-react";

const formSchema = z.object({
  address: z.string()
    .min(1, "Solana address cannot be empty.")
    .regex(/^[1-9A-HJ-NP-Za-km-z]{43,44}$/, "Invalid Solana address format. Must be 43-44 Base58 characters."),
});

type WalletInputFormProps = {
  addWalletAction: ReturnType<typeof useRuggedWallets>['addWallet'];
};

export function WalletInputForm({ addWalletAction }: WalletInputFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const result = await addWalletAction(values.address);
    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      });
      form.reset();
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Add Rugged Solana Wallet</CardTitle>
        <CardDescription>Enter a Solana wallet address to add to the scam list.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solana Wallet Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Solana address (e.g., SoLAnAd...)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              <PlusCircle className="mr-2 h-5 w-5" /> Add to List
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
