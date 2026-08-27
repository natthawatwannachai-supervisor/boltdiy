import { useCallback, useState } from 'react';
import { CREDIT_COSTS, type CreditAction } from '@/constants/billing';
import { AppError, toAppError } from '@/lib/errors';
import { useWallet } from '@/store/session';

interface GuardState {
  visible: boolean;
  required: number;
  balance: number;
  action: CreditAction | null;
}

const EMPTY: GuardState = { visible: false, required: 0, balance: 0, action: null };

/**
 * ตรวจเครดิตก่อนเรียก AI และดักกรณีที่ backend ตอบกลับว่าเครดิตไม่พอ
 * เพื่อเปิด sheet "ซื้อเครดิต / อัปเกรด" แทนการโยน error ดิบ ๆ ให้ครู
 */
export const useCreditGuard = () => {
  const wallet = useWallet();
  const [state, setState] = useState<GuardState>(EMPTY);

  const balance = wallet?.balance ?? 0;

  const ensure = useCallback(
    (action: CreditAction, quantity = 1) => {
      const required = CREDIT_COSTS[action] * quantity;

      if (balance < required) {
        setState({ visible: true, required, balance, action });
        return false;
      }

      return true;
    },
    [balance],
  );

  /** ตรวจยอดรวมทั้งงาน เช่น ก่อนสั่งให้ AI ทำวิดีโอครบทุกขั้นในครั้งเดียว */
  const ensureAmount = useCallback(
    (required: number, action: CreditAction) => {
      if (balance < required) {
        setState({ visible: true, required, balance, action });
        return false;
      }

      return true;
    },
    [balance],
  );

  /** ครอบการเรียก AI ทุกครั้ง — ถ้า backend บอกว่าเครดิตไม่พอ ให้เปิด sheet แทน */
  const run = useCallback(
    async <T>(action: CreditAction, quantity: number, fn: () => Promise<T>): Promise<T | null> => {
      if (!ensure(action, quantity)) {
        return null;
      }

      try {
        return await fn();
      } catch (error) {
        const appError = toAppError(error);

        if (appError.code === 'INSUFFICIENT_CREDITS') {
          setState({
            visible: true,
            required: appError.details.required ?? CREDIT_COSTS[action] * quantity,
            balance: appError.details.balance ?? balance,
            action,
          });

          return null;
        }

        throw appError instanceof AppError ? appError : error;
      }
    },
    [balance, ensure],
  );

  return {
    ...state,
    balance,
    ensure,
    ensureAmount,
    run,
    dismiss: useCallback(() => setState(EMPTY), []),
  };
};
