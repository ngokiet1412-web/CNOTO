import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus, Vibration } from 'react-native';
import {
  CockpitTheme,
  ConnectionStatus,
  DriveMode,
  Esp32Telemetry,
  GearPosition,
  MotorConfigPatch,
  MotorDirection,
} from './types';

const DEFAULT_TELEMETRY: Esp32Telemetry = {
  dir: 'STOP',
  speed: 0,
  targetPwm: 0,
  actualPwm: 0,
  signedPwm: 0,
  rpwm: 0,
  lpwm: 0,
  en: 0,
  maxPwm: 185,
  softReverse: true,
  invert: false,
  failsafe: true,
  servoAngle: 90,
  appliedServoAngle: 90,
  servoUs: 1470,
  servoTrim: 0,
  servoSwing: 90,
  invertServo: false,
  rpm: 0,
  kmh: 0,
  mps: 0,
  pulses: 0,
  distM: 0,
  encLevel: 1,
  ppr: 20,
  wheelMm: 65,
  clients: 0,
  uptime: 0,
};

export const DRIVE_MODE_PWM: Record<DriveMode, number> = {
  ECO: 115,    // ~45% công suất - lái êm trong nhà
  NORMAL: 185, // ~73% công suất - cân bằng chuẩn
  SPORT: 255,  // 100% công suất - bứt tốc tối đa
};

export function resolveTheme(driveMode: DriveMode, gear: GearPosition): CockpitTheme {
  if (gear === 'R') {
    return {
      id: 'REVERSE',
      label: 'SỐ LÙI (R)',
      primary: '#f59e0b',
      secondary: '#fbbf24',
      glow: 'rgba(245, 158, 11, 0.35)',
      softBg: 'rgba(245, 158, 11, 0.14)',
      border: '#d97706',
    };
  }
  switch (driveMode) {
    case 'ECO':
      return {
        id: 'ECO',
        label: 'ECO',
        primary: '#10b981',
        secondary: '#34d399',
        glow: 'rgba(16, 185, 129, 0.32)',
        softBg: 'rgba(16, 185, 129, 0.14)',
        border: '#059669',
      };
    case 'SPORT':
      return {
        id: 'SPORT',
        label: 'SPORT',
        primary: '#f97316',
        secondary: '#fb923c',
        glow: 'rgba(249, 115, 22, 0.36)',
        softBg: 'rgba(249, 115, 22, 0.15)',
        border: '#ea580c',
      };
    case 'NORMAL':
    default:
      return {
        id: 'NORMAL',
        label: 'NORMAL',
        primary: '#06b6d4',
        secondary: '#22d3ee',
        glow: 'rgba(6, 182, 212, 0.34)',
        softBg: 'rgba(6, 182, 212, 0.14)',
        border: '#0891b2',
      };
  }
}

export function useEsp32Controller(initialIp = '192.168.4.1') {
  const [espIp, setEspIp] = useState<string>(initialIp);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [pingMs, setPingMs] = useState<number | null>(null);

  const [gear, setGear] = useState<GearPosition>('D');
  const [direction, setDirection] = useState<MotorDirection>('STOP');
  const [speed, setSpeed] = useState<number>(0);
  const [pedalPct, setPedalPct] = useState<number>(0);
  const [isBraking, setIsBraking] = useState<boolean>(false);
  const [servoAngle, setServoAngle] = useState<number>(90);

  const [telemetry, setTelemetry] = useState<Esp32Telemetry>(DEFAULT_TELEMETRY);
  const [peakKmh, setPeakKmh] = useState<number>(0);
  const [peakRpm, setPeakRpm] = useState<number>(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const statusRef = useRef<ConnectionStatus>('connecting');
  const ipRef = useRef<string>(initialIp);
  const gearRef = useRef<GearPosition>('D');
  const isBrakingRef = useRef<boolean>(false);
  const directionRef = useRef<MotorDirection>('STOP');
  const speedRef = useRef<number>(0);
  const servoAngleRef = useRef<number>(90);

  // Điều tiết gửi lệnh Motor (~40ms = 25Hz)
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentAtRef = useRef<number>(0);
  const pendingCmdRef = useRef<{ dir: MotorDirection; speed: number } | null>(null);

  // Điều tiết gửi lệnh Servo (~28ms = 35Hz mượt theo vô-lăng)
  const servoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastServoSentAtRef = useRef<number>(0);
  const pendingServoRef = useRef<number | null>(null);

  statusRef.current = status;
  ipRef.current = espIp.trim() || '192.168.4.1';
  gearRef.current = gear;
  isBrakingRef.current = isBraking;
  directionRef.current = direction;
  speedRef.current = speed;
  servoAngleRef.current = servoAngle;

  const driveMode: DriveMode = useMemo(() => {
    const mp = telemetry.maxPwm ?? 255;
    if (mp <= 140) return 'ECO';
    if (mp <= 215) return 'NORMAL';
    return 'SPORT';
  }, [telemetry.maxPwm]);

  const theme = useMemo(() => resolveTheme(driveMode, gear), [driveMode, gear]);

  const hapticTap = useCallback((ms = 12) => {
    try {
      Vibration.vibrate(ms);
    } catch {
      // ignore
    }
  }, []);

  const applyServerTelemetry = useCallback((data: Partial<Esp32Telemetry>) => {
    if (typeof data.t === 'number' && data.type === 'pong') {
      const rtt = Math.max(1, Date.now() - data.t);
      setPingMs(rtt);
    }
    if (typeof data.kmh === 'number' && data.kmh > 0) {
      setPeakKmh((prev) => (data.kmh! > prev ? data.kmh! : prev));
    }
    if (typeof data.rpm === 'number' && data.rpm > 0) {
      setPeakRpm((prev) => (data.rpm! > prev ? data.rpm! : prev));
    }
    setTelemetry((prev) => ({
      ...prev,
      ...data,
    }));
  }, []);

  const fetchHttpFallback = useCallback(
    async (path: string): Promise<boolean> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 900);
      try {
        const t0 = Date.now();
        const res = await fetch(`http://${ipRef.current}${path}`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) return false;
        const json = (await res.json()) as Partial<Esp32Telemetry>;
        setPingMs(Math.max(1, Date.now() - t0));
        applyServerTelemetry(json);
        if (statusRef.current !== 'connected_ws') {
          setStatus('connected_http');
          setLastError(null);
        }
        return true;
      } catch {
        clearTimeout(timeout);
        return false;
      }
    },
    [applyServerTelemetry]
  );

  const connectWebSocket = useCallback(() => {
    const cleanIp = ipRef.current;
    if (!cleanIp) return;

    if (wsRef.current) {
      try {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }

    if (statusRef.current === 'disconnected') {
      setStatus('connecting');
    }

    try {
      const ws = new WebSocket(`ws://${cleanIp}:81`);
      wsRef.current = ws;

      const handshakeTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          try {
            ws.close();
          } catch {
            // ignore
          }
        }
      }, 1600);

      ws.onopen = () => {
        clearTimeout(handshakeTimeout);
        setStatus('connected_ws');
        setLastError(null);
        ws.send(JSON.stringify({ cmd: 'hb', t: Date.now() }));
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(String(event.data)) as Partial<Esp32Telemetry>;
          applyServerTelemetry(parsed);
        } catch {
          // ignore
        }
      };

      ws.onerror = () => {
        clearTimeout(handshakeTimeout);
      };

      ws.onclose = () => {
        clearTimeout(handshakeTimeout);
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
        fetchHttpFallback('/status').then((ok) => {
          if (!ok && (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) {
            setStatus('disconnected');
            setPingMs(null);
            setLastError(`Chưa tìm thấy mạch ESP32 tại ${cleanIp}`);
          }
        });
      };
    } catch {
      setStatus('disconnected');
      setLastError(`Không thể mở kết nối tới ${cleanIp}`);
    }
  }, [applyServerTelemetry, fetchHttpFallback]);

  // =================== ĐIỀU KHIỂN MOTOR IBT-2 ===================
  const dispatchControlNow = useCallback(
    (nextDir: MotorDirection, nextSpeed: number) => {
      lastSentAtRef.current = Date.now();
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            cmd: 'control',
            dir: nextDir,
            speed: nextSpeed,
          })
        );
      } else {
        fetchHttpFallback(`/control?dir=${nextDir}&speed=${nextSpeed}`);
      }
    },
    [fetchHttpFallback]
  );

  const scheduleControlSend = useCallback(
    (nextDir: MotorDirection, nextSpeed: number, immediate = false) => {
      const clamped = Math.min(100, Math.max(0, Math.round(nextSpeed)));
      setDirection(nextDir);
      setSpeed(clamped);

      if (immediate) {
        if (throttleTimerRef.current) {
          clearTimeout(throttleTimerRef.current);
          throttleTimerRef.current = null;
        }
        pendingCmdRef.current = null;
        dispatchControlNow(nextDir, clamped);
        return;
      }

      const elapsed = Date.now() - lastSentAtRef.current;
      const MIN_INTERVAL_MS = 40;
      if (elapsed >= MIN_INTERVAL_MS) {
        dispatchControlNow(nextDir, clamped);
      } else {
        pendingCmdRef.current = { dir: nextDir, speed: clamped };
        if (!throttleTimerRef.current) {
          throttleTimerRef.current = setTimeout(() => {
            throttleTimerRef.current = null;
            if (pendingCmdRef.current) {
              const { dir, speed: sp } = pendingCmdRef.current;
              pendingCmdRef.current = null;
              dispatchControlNow(dir, sp);
            }
          }, MIN_INTERVAL_MS - elapsed);
        }
      }
    },
    [dispatchControlNow]
  );

  // =================== ĐIỀU KHIỂN MICRO SERVO 9G ===================
  const dispatchServoNow = useCallback(
    (angle: number) => {
      lastServoSentAtRef.current = Date.now();
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ cmd: 'servo', angle }));
      } else {
        fetchHttpFallback(`/servo?angle=${angle}`);
      }
    },
    [fetchHttpFallback]
  );

  const scheduleServoSend = useCallback(
    (nextAngle: number, immediate = false) => {
      const clamped = Math.min(180, Math.max(0, Math.round(nextAngle)));
      setServoAngle(clamped);

      if (immediate) {
        if (servoTimerRef.current) {
          clearTimeout(servoTimerRef.current);
          servoTimerRef.current = null;
        }
        pendingServoRef.current = null;
        dispatchServoNow(clamped);
        return;
      }

      const elapsed = Date.now() - lastServoSentAtRef.current;
      const MIN_SERVO_MS = 28;
      if (elapsed >= MIN_SERVO_MS) {
        dispatchServoNow(clamped);
      } else {
        pendingServoRef.current = clamped;
        if (!servoTimerRef.current) {
          servoTimerRef.current = setTimeout(() => {
            servoTimerRef.current = null;
            if (pendingServoRef.current !== null) {
              const ang = pendingServoRef.current;
              pendingServoRef.current = null;
              dispatchServoNow(ang);
            }
          }, MIN_SERVO_MS - elapsed);
        }
      }
    },
    [dispatchServoNow]
  );

  // =================== CƠ CHẾ BUỒNG LÁI Ô TÔ (VÔ-LĂNG + CHÂN GA + HỘP SỐ) ===================
  const applyGasPedal = useCallback(
    (rawPct: number) => {
      const clamped = Math.min(100, Math.max(0, Math.round(rawPct)));
      if (isBrakingRef.current || clamped === 0) {
        setPedalPct(0);
        scheduleControlSend('STOP', 0, true);
        return;
      }

      setPedalPct(clamped);
      const curGear = gearRef.current;
      if (curGear === 'D') {
        scheduleControlSend('FWD', clamped, false);
      } else if (curGear === 'R') {
        scheduleControlSend('REV', clamped, false);
      } else {
        // Đang ở số P hoặc N: bàn đạp có nhún nhưng hộp số ngắt truyền động
        if (directionRef.current !== 'STOP' || speedRef.current !== 0) {
          scheduleControlSend('STOP', 0, true);
        }
      }
    },
    [scheduleControlSend]
  );

  const releaseGasPedal = useCallback(() => {
    setPedalPct(0);
    scheduleControlSend('STOP', 0, true);
  }, [scheduleControlSend]);

  const pressBrakeStart = useCallback(() => {
    hapticTap(20);
    isBrakingRef.current = true;
    setIsBraking(true);
    setPedalPct(0);
    scheduleControlSend('STOP', 0, true);
  }, [hapticTap, scheduleControlSend]);

  const pressBrakeEnd = useCallback(() => {
    isBrakingRef.current = false;
    setIsBraking(false);
  }, []);

  const changeGear = useCallback(
    (nextGear: GearPosition) => {
      if (gearRef.current === nextGear) return;
      hapticTap(18);
      gearRef.current = nextGear;
      setGear(nextGear);
      setPedalPct(0);
      scheduleControlSend('STOP', 0, true);
    },
    [hapticTap, scheduleControlSend]
  );

  const changeServoSmooth = useCallback(
    (angle: number) => {
      scheduleServoSend(angle, false);
    },
    [scheduleServoSend]
  );

  const releaseSteeringWheel = useCallback(() => {
    scheduleServoSend(90, true);
  }, [scheduleServoSend]);

  const setServoPreset = useCallback(
    (angle: number) => {
      hapticTap(12);
      scheduleServoSend(angle, true);
    },
    [hapticTap, scheduleServoSend]
  );

  const emergencyStop = useCallback(() => {
    hapticTap(45);
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
    if (servoTimerRef.current) {
      clearTimeout(servoTimerRef.current);
      servoTimerRef.current = null;
    }
    pendingCmdRef.current = null;
    pendingServoRef.current = null;
    gearRef.current = 'P';
    setGear('P');
    setPedalPct(0);
    setIsBraking(false);
    isBrakingRef.current = false;
    setDirection('STOP');
    setSpeed(0);
    setServoAngle(90);

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ cmd: 'estop' }));
    } else {
      fetchHttpFallback('/estop');
    }
  }, [fetchHttpFallback, hapticTap]);

  const resetEncoder = useCallback(() => {
    hapticTap(20);
    setPeakKmh(0);
    setPeakRpm(0);
    setTelemetry((prev) => ({
      ...prev,
      pulses: 0,
      distM: 0,
      rpm: 0,
      kmh: 0,
      mps: 0,
    }));

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ cmd: 'reset_encoder' }));
    } else {
      fetchHttpFallback('/encoder/reset');
    }
  }, [fetchHttpFallback, hapticTap]);

  const updateConfig = useCallback(
    (patch: MotorConfigPatch) => {
      hapticTap(12);
      setTelemetry((prev) => ({ ...prev, ...patch }));

      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ cmd: 'config', ...patch }));
      } else {
        const params: string[] = [];
        if (patch.maxPwm !== undefined) params.push(`maxPwm=${patch.maxPwm}`);
        if (patch.softReverse !== undefined)
          params.push(`softReverse=${patch.softReverse ? 1 : 0}`);
        if (patch.invert !== undefined)
          params.push(`invert=${patch.invert ? 1 : 0}`);
        if (patch.failsafe !== undefined)
          params.push(`failsafe=${patch.failsafe ? 1 : 0}`);
        if (patch.servoTrim !== undefined)
          params.push(`servoTrim=${patch.servoTrim}`);
        if (patch.servoSwing !== undefined)
          params.push(`servoSwing=${patch.servoSwing}`);
        if (patch.invertServo !== undefined)
          params.push(`invertServo=${patch.invertServo ? 1 : 0}`);
        if (patch.ppr !== undefined) params.push(`ppr=${patch.ppr}`);
        if (patch.wheelMm !== undefined) params.push(`wheelMm=${patch.wheelMm}`);
        if (params.length > 0) {
          fetchHttpFallback(`/config?${params.join('&')}`);
        }
      }
    },
    [fetchHttpFallback, hapticTap]
  );

  const selectDriveMode = useCallback(
    (mode: DriveMode) => {
      updateConfig({ maxPwm: DRIVE_MODE_PWM[mode] });
    },
    [updateConfig]
  );

  useEffect(() => {
    connectWebSocket();

    const reconnectInterval = setInterval(() => {
      const ws = wsRef.current;
      if (!ws || (ws.readyState !== WebSocket.OPEN && ws.readyState !== WebSocket.CONNECTING)) {
        connectWebSocket();
      }
    }, 2200);

    const heartbeatInterval = setInterval(() => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ cmd: 'hb', t: Date.now() }));
        } catch {
          // ignore
        }
      } else if (statusRef.current === 'connected_http') {
        fetchHttpFallback('/status');
      }
    }, 500);

    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        connectWebSocket();
      } else {
        // An toàn tự nhả ga & trả thẳng lái khi thoát ngầm ứng dụng
        setPedalPct(0);
        isBrakingRef.current = false;
        setIsBraking(false);
        scheduleControlSend('STOP', 0, true);
        scheduleServoSend(90, true);
      }
    });

    return () => {
      clearInterval(reconnectInterval);
      clearInterval(heartbeatInterval);
      appStateSub.remove();
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
      if (servoTimerRef.current) clearTimeout(servoTimerRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, [espIp, connectWebSocket, fetchHttpFallback, scheduleControlSend, scheduleServoSend]);

  return {
    espIp,
    setEspIp,
    status,
    pingMs,
    gear,
    changeGear,
    driveMode,
    selectDriveMode,
    theme,
    direction,
    speed,
    pedalPct,
    isBraking,
    servoAngle,
    telemetry,
    peakKmh,
    peakRpm,
    lastError,
    reconnect: connectWebSocket,
    applyGasPedal,
    releaseGasPedal,
    pressBrakeStart,
    pressBrakeEnd,
    changeServoSmooth,
    releaseSteeringWheel,
    setServoPreset,
    emergencyStop,
    resetEncoder,
    updateConfig,
  };
}
