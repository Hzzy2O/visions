"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { networkConfig, network, suiClient } from '@/contracts';
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { useTransactionNotifier } from '@/components/ui/TransactionNotifier';

export default function CreatorSetupPage() {
  const router = useRouter();

  // 获取链上 packageId
  const packageId = networkConfig[network].variables.package;
  // 获取钱包当前账户
  const account = useCurrentAccount();
  // 获取链上交易签名与执行能力
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { showTxStatus } = useTransactionNotifier();

  const [formData, setFormData] = useState({
    creatorName: "",
    creatorBio: "",
    subscriptionPrice: "0",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 明确类型声明，修复 linter 报错
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 页面加载时检查是否已有 creator 对象
  useEffect(() => {
    const checkCreator = async () => {
      if (!account?.address) return;
      try {
        // 查询当前地址是否拥有 Creator 对象
        const objects = await suiClient.getOwnedObjects({
          owner: account.address,
          filter: {
            StructType: `${packageId}::creator::Creator`,
          },
          options: { showContent: true },
        });
        if (objects.data && objects.data.length > 0) {
          // 已有 creator，直接跳转
          router.push("/profile/" + account.address);
        }
      } catch (e) {
        // 查询失败时忽略，继续展示表单
      }
    };
    checkCreator();
  }, [account?.address, packageId, router]);

  // 表单提交，链上调用
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!account?.address) {
      alert("Please connect your wallet first");
      setIsSubmitting(false);
      return;
    }

    try {
      // 构建链上交易
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::creator::become_creator`,
        arguments: [
          tx.object(normalizeSuiAddress(account.address)), // address，直接字符串
          tx.pure.string(formData.creatorName), // vector<u8>
          tx.pure.string(formData.creatorBio), // vector<u8>
        ],
      });

      // 发起链上交易
      await signAndExecute({ transaction: tx},
        {
          onSuccess: async (result) => {
            showTxStatus('processing', 'Submitting transaction...', result.digest);
            await suiClient.waitForTransaction({ digest: result.digest });
            const txDetails = await suiClient.getTransactionBlock({ digest: result.digest });
            console.log('txDetails', txDetails);
            showTxStatus('completed', 'Subscribed successfully!', result.digest);
            router.push("/profile");
          },
          onError: () => {
            showTxStatus('failed', 'Subscribe failed.');
          },
        }
      );

    } catch (err: any) {
      alert("Transaction failed: " + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8 md:py-12">
      <h1 className="mb-8 text-3xl font-bold">Become a Creator</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Creator Information</h2>

            <div className="space-y-2">
              <Label htmlFor="creatorName">Creator Name</Label>
              <Input
                id="creatorName"
                name="creatorName"
                value={formData.creatorName}
                onChange={handleInputChange}
                required
                placeholder="Your creator name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creatorBio">Creator Bio</Label>
              <Textarea
                id="creatorBio"
                name="creatorBio"
                value={formData.creatorBio}
                onChange={handleInputChange}
                rows={4}
                placeholder="Tell others about your creative work..."
                required
              />
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            type="submit"
            className="bg-blue text-white hover:bg-blue/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Creator Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
