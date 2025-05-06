import { Transaction } from "@mysten/sui/transactions";
import { networkConfig, network } from ".";

const PACKAGE_ID = networkConfig[network].variables.package;

/**
 * Creates a transaction to create a new staking pool
 * @param initialRewardCoinId - The coin ID to use as initial reward
 * @param tokenType - The token type for the staking pool
 * @param rewardRate - Annual reward rate in basis points (e.g., 500 = 5%)
 * @param lockPeriodDays - Minimum lock period in days
 */
export function createStakingPoolTx(
	initialRewardCoinId: string,
	tokenType: string,
	rewardRate: number = 500, // Default 5% APR
	lockPeriodDays: number = 7, // Default 7 days
) {
	const tx = new Transaction();

	tx.moveCall({
		target: `${PACKAGE_ID}::staking::create_staking_pool`,
		arguments: [
			tx.object(initialRewardCoinId),
			tx.pure.u64(rewardRate),
			tx.pure.u64(lockPeriodDays),
		],
		typeArguments: [tokenType],
	});

	tx.setGasBudget(100000000);
	return tx;
}

/**
 * Creates a transaction to stake tokens
 * @param poolId - The staking pool ID
 * @param tokenCoinId - The coin ID to stake
 * @param tokenType - The token type
 */
export function stakeTx(
	poolId: string,
	tokenCoinId: string,
	tokenType: string,
) {
	const tx = new Transaction();

	tx.moveCall({
		target: `${PACKAGE_ID}::staking::stake`,
		arguments: [
			tx.object(poolId),
			tx.object(tokenCoinId),
			tx.object("0x6"), // Clock object
		],
		typeArguments: [tokenType],
	});

	tx.setGasBudget(100000000);
	return tx;
}

/**
 * Creates a transaction to unstake tokens
 * @param poolId - The staking pool ID
 * @param amount - The amount to unstake
 * @param tokenType - The token type
 */
export function unstakeTx(
	poolId: string,
	amount: bigint,
	tokenType: string,
) {
	const tx = new Transaction();

	tx.moveCall({
		target: `${PACKAGE_ID}::staking::unstake`,
		arguments: [
			tx.object(poolId),
			tx.pure.u64(amount),
			tx.object("0x6"), // Clock object
		],
		typeArguments: [tokenType],
	});

	tx.setGasBudget(100000000);
	return tx;
}

/**
 * Creates a transaction to claim rewards
 * @param poolId - The staking pool ID
 * @param tokenType - The token type
 */
export function claimRewardTx(
	poolId: string,
	tokenType: string,
) {
	const tx = new Transaction();

	tx.moveCall({
		target: `${PACKAGE_ID}::staking::claim_reward`,
		arguments: [
			tx.object(poolId),
			tx.object("0x6"), // Clock object
		],
		typeArguments: [tokenType],
	});

	tx.setGasBudget(100000000);
	return tx;
}

/**
 * Gets staking pool information
 * @param poolId - The staking pool ID
 * @returns Promise with pool data
 */
export async function getStakingPoolInfo(client: any, poolId: string) {
	try {
		const poolData = await client.getObject({
			id: poolId,
			options: { showContent: true },
		});

		if (
			!poolData.data?.content ||
			poolData.data?.content?.dataType !== "moveObject"
		) {
			throw new Error("Staking pool not found");
		}
		const { fields } = poolData.data.content;
		return {
			tokenBalance: fields.token_balance,
			rewardBalance: fields.reward_balance,
			rewardRate: fields.reward_rate,
			totalStaked: fields.total_staked,
			lockPeriodDays: fields.lock_period_days,
		};
	} catch (error) {
		console.error("Failed to get staking pool data:", error);
		throw error;
	}
}

/**
 * Gets user stake information
 * @param client - Sui client
 * @param poolId - The staking pool ID
 * @param address - User address
 * @param tokenType - The token type
 * @returns Promise with stake data
 */
export async function getUserStakeInfo(client: any, poolId: string, address: string, tokenType: string) {
	try {
		const result = await client.devInspectTransactionBlock({
			sender: address,
			transactionBlock: new Transaction()
				.moveCall({
					target: `${PACKAGE_ID}::staking::get_stake_info`,
					arguments: [Transaction.pure(poolId)],
					typeArguments: [tokenType],
				})
				.blockData,
		});

		if (result.results?.[0]?.returnValues) {
			const [amount, startTime, lockEndTime] = result.results[0].returnValues;
			return {
				amount: BigInt(amount),
				startTime: Number(startTime),
				lockEndTime: Number(lockEndTime),
				isLocked: Date.now() / 1000 < Number(lockEndTime),
			};
		}

		return {
			amount: BigInt(0),
			startTime: 0,
			lockEndTime: 0,
			isLocked: false,
		};
	} catch (error) {
		console.error("Failed to get user stake info:", error);
		return {
			amount: BigInt(0),
			startTime: 0,
			lockEndTime: 0,
			isLocked: false,
		};
	}
}

/**
 * Gets pending reward amount
 * @param client - Sui client
 * @param poolId - The staking pool ID
 * @param address - User address
 * @param tokenType - The token type
 * @returns Promise with pending reward amount
 */
export async function getPendingReward(client: any, poolId: string, address: string, tokenType: string) {
	try {
		const result = await client.devInspectTransactionBlock({
			sender: address,
			transactionBlock: new Transaction()
				.moveCall({
					target: `${PACKAGE_ID}::staking::calculate_pending_reward`,
					arguments: [
						Transaction.pure(poolId),
						Transaction.pure(address),
						Transaction.pure("0x6"), // Clock object
					],
					typeArguments: [tokenType],
				})
				.blockData,
		});

		if (result.results?.[0]?.returnValues) {
			return BigInt(result.results[0].returnValues[0]);
		}

		return BigInt(0);
	} catch (error) {
		console.error("Failed to get pending reward:", error);
		return BigInt(0);
	}
}
