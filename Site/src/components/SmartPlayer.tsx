import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  MonitorPlay,
  Server,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Settings,
  Gauge,
  RotateCcw,
  RotateCw,
  Lightbulb,
} from "lucide-react";
import type { VideoData, VideoSource } from "@/types/anime";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PlayerMode = "hls" | "mp4" | "iframe" | "blogger" | "none" | string;

interface SmartPlayerProps {
  videoData: string | VideoData | null;
  poster?: string;
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || isNaN(sec)) return "0:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const SmartPlayer = ({ videoData, poster }: SmartPlayerProps) => {
  const sources = useMemo<VideoSource[]>(() => {
    if (!videoData) return [];
    if (typeof videoData === "string") {
      const mode = videoData.includes(".m3u8")
        ? "hls"
        : videoData.includes("yandex") || videoData.includes("share")
        ? "iframe"
        : "mp4";
      return [{ url: videoData, type: mode, label: "Servidor Principal" }];
    }
    if (videoData.players && videoData.players.length > 0) {
      return [...videoData.players].sort((a, b) => {
        const score = (t: string) => (t === "mp4" ? 3 : t === "hls" ? 2 : t === "iframe" ? 1 : 0);
        return score(b.type) - score(a.type);
      });
    }
    if (videoData.main) {
      const mode = videoData.main.includes(".m3u8") ? "hls" : "mp4";
      return [{ url: videoData.main, type: mode, label: "Servidor Padrão" }];
    }
    return [];
  }, [videoData]);

  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const activeSource = sources[activeSourceIndex] || null;
  const mode: PlayerMode = activeSource ? activeSource.type : "none";
  const videoUrl = activeSource?.url || null;
  const isNativeVideo = mode === "hls" || mode === "mp4";

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hlsRef = useRef<any>(null);

  // Player state
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [hlsLevels, setHlsLevels] = useState<{ height: number; index: number }[]>([]);
  const [hlsQuality, setHlsQuality] = useState(-1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [rippleIcon, setRippleIcon] = useState<"play" | "pause">("play");
  const [lightsOff, setLightsOff] = useState(false);

  // HLS setup
  useEffect(() => {
    const videoElement = videoRef.current;
    hlsRef.current?.destroy();
    hlsRef.current = null;
    setHlsLevels([]);
    setHlsQuality(-1);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    if (!videoElement || !isNativeVideo || !videoUrl) {
      if (videoElement && mode !== "mp4") {
        videoElement.removeAttribute("src");
        videoElement.load();
      }
      return;
    }

    if (mode !== "hls") return;

    let cancelled = false;
    const setupHls = async () => {
      const { default: Hls } = await import("hls.js");
      if (cancelled || !videoRef.current) return;
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(videoUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const levels = hls.levels.map((l: { height: number }, i: number) => ({ height: l.height, index: i }));
          setHlsLevels(levels);
        });
        hlsRef.current = hls;
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.current.src = videoUrl;
      }
    };
    void setupHls();
    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, videoUrl]);

  // Video events
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(v.currentTime);
      if (v.buffered.length > 0) setBufferedEnd(v.buffered.end(v.buffered.length - 1));
    };
    const onDurationChange = () => setDuration(v.duration);
    const onVolumeChange = () => { setVolume(v.volume); setMuted(v.muted); };
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("durationchange", onDurationChange);
    v.addEventListener("volumechange", onVolumeChange);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("canplay", onCanPlay);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("durationchange", onDurationChange);
      v.removeEventListener("volumechange", onVolumeChange);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("canplay", onCanPlay);
    };
  }, []);

  // Fullscreen listener
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Auto-hide controls
  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
      setShowSpeedMenu(false);
      setShowQualityMenu(false);
    }, 3000);
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  // Ripple animation on click
  const triggerRipple = useCallback((icon: "play" | "pause") => {
    setRippleIcon(icon);
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 600);
  }, []);

  // Controls
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); triggerRipple("play"); }
    else { v.pause(); triggerRipple("pause"); }
  }, [triggerRipple]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Number(e.target.value);
    setCurrentTime(Number(e.target.value));
  }, []);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = Number(e.target.value);
    v.volume = val;
    v.muted = val === 0;
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) void el.requestFullscreen();
    else void document.exitFullscreen();
  }, []);

  const handleSpeed = useCallback((s: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
  }, []);

  const handleQuality = useCallback((index: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = index;
    setHlsQuality(index);
    setShowQualityMenu(false);
  }, []);

  const skip = useCallback((seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + seconds));
  }, []);

  const getAutoplayUrl = (url: string) => {
    if (!url) return "";
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set("autoplay", "1");
      return urlObj.toString();
    } catch {
      return url + (url.includes("?") ? "&autoplay=1" : "?autoplay=1");
    }
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (bufferedEnd / duration) * 100 : 0;
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const controlsVisible = showControls || !playing;

  return (
    <div
      className="space-y-4"
      style={lightsOff ? { position: "relative", zIndex: 9999, isolation: "isolate" } : undefined}
    >
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-border shadow-2xl bg-black ring-1 ring-white/5"
        onMouseMove={isNativeVideo ? handleMouseMove : undefined}
        onMouseLeave={isNativeVideo ? () => { if (playing) setShowControls(false); } : undefined}
      >
        {/* Top glow */}
        <div className="absolute inset-x-0 -top-px mx-auto h-px w-2/3 bg-gradient-to-r from-transparent via-primary/50 to-transparent pointer-events-none z-10" />
        <div className="absolute -top-24 left-1/2 h-48 w-full -translate-x-1/2 rounded-[100%] bg-primary/10 blur-[80px] pointer-events-none z-0" />

        {/* ── NATIVE VIDEO (MP4 / HLS) ── */}
        {isNativeVideo && videoUrl && (
          <>
            <video
              ref={videoRef}
              src={mode === "mp4" ? videoUrl : undefined}
              poster={poster}
              playsInline
              preload="metadata"
              className="relative aspect-video w-full bg-black outline-none cursor-pointer"
              onClick={togglePlay}
              onDoubleClick={toggleFullscreen}
            />

            {/* Buffering spinner */}
            {isBuffering && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="h-12 w-12 rounded-full border-[3px] border-white/10 border-t-primary animate-spin" />
              </div>
            )}

            {/* Click ripple */}
            {showRipple && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 animate-ping-once">
                  {rippleIcon === "play"
                    ? <Play size={28} fill="white" className="text-white translate-x-0.5" />
                    : <Pause size={28} fill="white" className="text-white" />
                  }
                </div>
              </div>
            )}

            {/* Big center play button (when paused & not buffering) */}
            {!playing && !isBuffering && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center z-10"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/50 backdrop-blur-md ring-2 ring-white/20 transition-all duration-200 hover:scale-110 hover:bg-primary/80 hover:ring-primary/50">
                  <Play size={34} className="translate-x-1 text-white" fill="white" />
                </div>
              </button>
            )}

            {/* Controls overlay */}
            <div
              className={`absolute inset-x-0 bottom-0 z-30 transition-all duration-300 ${
                controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
              }`}
            >
              {/* Gradient backdrop */}
              <div className="bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-14 pb-3 px-3 space-y-2">

                {/* Seek bar */}
                <div className="relative flex items-center h-4 group/seek cursor-pointer">
                  {/* Buffered track */}
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-white/20 pointer-events-none"
                    style={{ width: `${bufferedPct}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="ansen-seek"
                    style={{ "--prog": `${progressPct}%` } as React.CSSProperties}
                  />
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between gap-2">

                  {/* LEFT */}
                  <div className="flex items-center gap-1.5">

                    {/* Rewind 10s */}
                    <button onClick={() => skip(-10)} className="player-ctrl-btn" title="Voltar 10s">
                      <RotateCcw size={15} />
                    </button>

                    {/* Play/Pause */}
                    <button onClick={togglePlay} className="player-ctrl-btn" title={playing ? "Pausar" : "Reproduzir"}>
                      {playing
                        ? <Pause size={18} fill="white" className="text-white" />
                        : <Play size={18} fill="white" className="text-white translate-x-0.5" />
                      }
                    </button>

                    {/* Forward 10s */}
                    <button onClick={() => skip(10)} className="player-ctrl-btn" title="Avançar 10s">
                      <RotateCw size={15} />
                    </button>

                    {/* Volume */}
                    <div className="flex items-center gap-1 group/vol">
                      <button onClick={toggleMute} className="player-ctrl-btn" title="Mudo">
                        <VolumeIcon size={17} />
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.02}
                        value={muted ? 0 : volume}
                        onChange={handleVolume}
                        className="ansen-vol w-0 opacity-0 group-hover/vol:w-16 group-hover/vol:opacity-100 transition-all duration-200"
                        style={{ "--prog": `${(muted ? 0 : volume) * 100}%` } as React.CSSProperties}
                      />
                    </div>

                    {/* Time */}
                    <span className="text-[11px] font-mono text-white/70 tabular-nums select-none pl-1">
                      {formatTime(currentTime)}<span className="text-white/40"> / </span>{formatTime(duration)}
                    </span>
                  </div>

                  {/* RIGHT */}
                  <div className="flex items-center gap-1">

                    {/* Speed */}
                    <div className="relative">
                      <button
                        onClick={() => { setShowSpeedMenu(v => !v); setShowQualityMenu(false); }}
                        className="player-ctrl-btn px-2 gap-1 text-[11px] font-bold tracking-wide"
                        title="Velocidade"
                      >
                        <Gauge size={14} />
                        {speed}x
                      </button>
                      {showSpeedMenu && (
                        <div className="absolute bottom-full right-0 mb-2 min-w-[76px] rounded-xl border border-white/10 bg-black/95 backdrop-blur-md shadow-2xl p-1">
                          {SPEEDS.map((s) => (
                            <button
                              key={s}
                              onClick={() => handleSpeed(s)}
                              className={`w-full rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${
                                speed === s ? "bg-primary text-white font-semibold" : "text-white/70 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {s}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* HLS Quality */}
                    {hlsLevels.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => { setShowQualityMenu(v => !v); setShowSpeedMenu(false); }}
                          className="player-ctrl-btn px-2 gap-1 text-[11px] font-bold tracking-wide"
                          title="Qualidade"
                        >
                          <Settings size={13} />
                          {hlsQuality === -1 ? "Auto" : `${hlsLevels.find(l => l.index === hlsQuality)?.height ?? ""}p`}
                        </button>
                        {showQualityMenu && (
                          <div className="absolute bottom-full right-0 mb-2 min-w-[86px] rounded-xl border border-white/10 bg-black/95 backdrop-blur-md shadow-2xl p-1">
                            <button
                              onClick={() => handleQuality(-1)}
                              className={`w-full rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${
                                hlsQuality === -1 ? "bg-primary text-white font-semibold" : "text-white/70 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              Auto
                            </button>
                            {[...hlsLevels].reverse().map((l) => (
                              <button
                                key={l.index}
                                onClick={() => handleQuality(l.index)}
                                className={`w-full rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${
                                  hlsQuality === l.index ? "bg-primary text-white font-semibold" : "text-white/70 hover:bg-white/10 hover:text-white"
                                }`}
                              >
                                {l.height}p
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fullscreen */}
                    <button onClick={toggleFullscreen} className="player-ctrl-btn" title="Tela cheia">
                      {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── IFRAME (blogger, yandex, etc.) — sem controle possível ── */}
        {!isNativeVideo && mode !== "none" && videoUrl && (
          <iframe
            key={videoUrl}
            src={getAutoplayUrl(videoUrl)}
            allowFullScreen
            allow="autoplay"
            className="relative aspect-video w-full bg-black outline-none border-none"
          />
        )}

        {/* ── SEM VÍDEO ── */}
        {mode === "none" && (
          <div className="relative flex aspect-video flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <MonitorPlay size={56} className="mb-4 text-white/20" />
            <p className="text-sm font-medium text-white/50">Nenhum vídeo disponível no momento</p>
          </div>
        )}
      </div>

      {/* Server selector + Lights Off */}
      {sources.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Label */}
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 flex-shrink-0">
            <Server size={14} /> Servidor
          </h4>

          {/* Player select */}
          <Select
            value={String(activeSourceIndex)}
            onValueChange={(val) => { setActiveSourceIndex(Number(val)); setShowSpeedMenu(false); setShowQualityMenu(false); }}
          >
            <SelectTrigger className="w-[200px] h-9 text-xs">
              <SelectValue placeholder="Selecione o servidor" />
            </SelectTrigger>
            <SelectContent style={lightsOff ? { zIndex: 9999 } : undefined}>
              {sources.map((source, index) => (
                <SelectItem key={index} value={String(index)} className="text-xs text-foreground cursor-pointer">
                  Player {index + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Lights Off button */}
          <div className="sm:ml-auto flex-shrink-0" title={lightsOff ? "Ligar luzes" : "Apagar luzes (modo cinema)"}>
            <button
              onClick={() => setLightsOff(v => !v)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                lightsOff
                  ? "border-primary/60 bg-primary/15 text-primary shadow-[0_0_12px_hsl(16_100%_50%/0.3)]"
                  : "border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <Lightbulb
                size={15}
                className={`transition-all duration-300 ${
                  lightsOff ? "fill-primary text-primary drop-shadow-[0_0_6px_hsl(16_100%_50%/0.8)]" : ""
                }`}
              />
              {lightsOff ? "Ligar luzes" : "Apagar luzes"}
            </button>
          </div>
        </div>
      )}

      {/* Lights-off overlay — renderizado no body via portal pra escapar de qualquer stacking context pai */}
      {lightsOff && createPortal(
        <div
          className="lights-off-overlay"
          onClick={() => setLightsOff(false)}
          aria-label="Clique para ligar as luzes"
        />,
        document.body
      )}
    </div>
  );
};

export default SmartPlayer;
