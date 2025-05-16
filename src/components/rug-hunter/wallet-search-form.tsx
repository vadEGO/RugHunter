
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
import type { useRuggedWallets } from "@/hooks/use-rugged-wallets";
import type { StatusDisplayType } from "./status-indicator";
import { Search } from "lucide-react";
// import { addGoodWalletServerAction } from "@/actions/wallet-actions"; // Removed for rollback
import { useToast } from "@/hooks/use-toast";


const formSchema = z.object({
  address: z.string()
    .min(1, "Solana address cannot be empty.")
    .regex(/^[1-9A-HJ-NP-Za-km-z]{43,44}$/, "Invalid Solana address format. Must be 43-44 Base58 characters."),
});

type WalletSearchFormProps = {
  isWalletRuggedAction: ReturnType<typeof useRuggedWallets>['isWalletRugged'];
  setSearchResult: (result: { status: StatusDisplayType; address?: string; message?: string }) => void;
};

export function WalletSearchForm({ isWalletRuggedAction, setSearchResult }: WalletSearchFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSearchResult({ status: 'checking', address: values.address });
    
    const isRugged = isWalletRuggedAction(values.address);
    if (isRugged) {
      setSearchResult({ status: 'rugged', address: values.address });
    } else {
      setSearchResult({ status: 'safe', address: values.address, message: "Address appears safe." });
      // Removed logic for adding to good wallets list
      // const addGoodResult = await addGoodWalletServerAction(values.address);
      // if (addGoodResult.success) {
      //   setSearchResult({ status: 'safe', address: values.address, message: "Address appears safe and has been noted." });
      // } else {
      //   setSearchResult({ status: 'safe', address: values.address, message: "Address appears safe. (Could not update internal 'good' list)" });
      //   toast({ title: "Info", description: addGoodResult.message || "Could not update internal 'good' list.", variant: "default" });
      // }
    }
    // form.reset(); 
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Check Solana Wallet</CardTitle>
        <CardDescription>Enter a Solana wallet address to check its status.</CardDescription> 
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
                    <Input placeholder="Enter Solana wallet address to check (e.g., SoLAnAd...)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              <Search className="mr-2 h-5 w-5" /> Check Address
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
