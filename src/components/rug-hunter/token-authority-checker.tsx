
"use client";

import { useState } from 'react';
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
import { useRuggedWallets } from '@/hooks/use-rugged-wallets';
import { useGoodWallets } from '@/hooks/use-good-wallets';
import { Loader2, Search, AlertTriangle, CheckCircle, ShieldQuestion } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  mintAddress: z.string()
    .min(1, "Token mint address cannot be empty.")
    .regex(/^[1-9A-HJ-NP-Za-km-z]{43,44}$/, "Invalid Solana address format. Must be 43-44 Base58 characters."),
});

interface AuthorityInfo {
  mintAddress: string;
  authorityType: string;
  authority: string | null;
}

type AuthorityStatus = 'rugged' | 'good' | 'unknown' | 'error' | 'idle' | 'loading';

export function TokenAuthorityChecker() {
  const { toast } = useToast();
  const { isWalletRugged, isLoaded: isRuggedListLoaded } = useRuggedWallets();
  const { isGoodWallet, isLoaded: isGoodListLoaded } = useGoodWallets();
  
  const [isLoading, setIsLoading] = useState(false);
  const [apiResult, setApiResult] = useState<AuthorityInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authorityStatus, setAuthorityStatus] = useState<AuthorityStatus>('idle');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mintAddress: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setApiResult(null);
    setError(null);
    setAuthorityStatus('loading');

    try {
      const response = await fetch(`/api/get-authority?mintAddress=${values.mintAddress}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data: AuthorityInfo = await response.json();
      setApiResult(data);

      if (data.authority) {
        if (isWalletRugged(data.authority)) {
          setAuthorityStatus('rugged');
        } else if (isGoodWallet(data.authority)) {
          setAuthorityStatus('good');
        } else {
          setAuthorityStatus('unknown');
        }
      } else {
        setAuthorityStatus('unknown'); // Or handle as a specific case like "no authority"
      }
      toast({ title: "Authority Check Complete", description: `Checked authority for ${data.mintAddress.substring(0,6)}...` });
    } catch (err: any) {
      setError(err.message || "Failed to fetch authority information.");
      setApiResult(null);
      setAuthorityStatus('error');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch authority information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const renderStatusPill = () => {
    if (!apiResult || !apiResult.authority) return null;

    let IconComponent;
    let badgeVariant: "destructive" | "default" | "secondary" = "secondary";
    let text = "Authority Status: Unknown";
    let iconColor = "text-muted-foreground";

    switch (authorityStatus) {
      case 'rugged':
        IconComponent = AlertTriangle;
        badgeVariant = "destructive";
        text = `Authority is KNOWN RUGGED`;
        iconColor = "text-red-500";
        break;
      case 'good':
        IconComponent = CheckCircle;
        badgeVariant = "default"; // Using default for good, which is primary theme color
        text = `Authority is KNOWN GOOD`;
        iconColor = "text-green-500";
        break;
      case 'unknown':
        IconComponent = ShieldQuestion;
        badgeVariant = "secondary";
        text = `Authority is UNKNOWN`;
        break;
      default:
        return null; // Should not happen if apiResult.authority exists
    }

    return (
      <Badge variant={badgeVariant} className="text-sm p-2 mt-4 flex items-center justify-center shadow-md">
        <IconComponent className={`h-5 w-5 mr-2 ${iconColor}`} /> {text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Token Authority Checker</CardTitle>
          <CardDescription>Enter a Solana token mint address to find its mint/update authority and check its status against known lists.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="mintAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Mint Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Solana token mint address (e.g., SoLAnAd...)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading || !isRuggedListLoaded || !isGoodListLoaded}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Search className="mr-2 h-5 w-5" />
                )}
                Check Authority
                {(!isRuggedListLoaded || !isGoodListLoaded) && !isLoading && (
                   <span className="text-xs ml-2">(Loading lists...)</span>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && authorityStatus === 'loading' && (
        <div className="flex items-center justify-center p-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Checking token authority...</p>
        </div>
      )}

      {error && authorityStatus === 'error' && (
         <Card className="w-full shadow-md border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-6 w-6" />Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {apiResult && (authorityStatus === 'good' || authorityStatus === 'rugged' || authorityStatus === 'unknown') && (
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Authority Details</CardTitle>
            <CardDescription>
              For Token Mint: <span className="font-mono text-xs break-all">{apiResult.mintAddress}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{apiResult.authorityType === 'updateAuthority' ? 'Update Authority' : 'Mint Authority'}:</p>
              {apiResult.authority ? (
                <p className="font-mono text-sm break-all">{apiResult.authority}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No authority found.</p>
              )}
            </div>
            {apiResult.authority && renderStatusPill()}
            {!apiResult.authority && (
                 <Badge variant="secondary" className="text-sm p-2 mt-4 flex items-center justify-center shadow-md">
                    <ShieldQuestion className="h-5 w-5 mr-2 text-muted-foreground" /> Authority not applicable or not found.
                </Badge>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
