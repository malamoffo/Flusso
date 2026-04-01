import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { imagePersistence } from '../utils/imagePersistence';
import { Capacitor } from '@capacitor/core';
import { FileText } from 'lucide-react';

// Global set to track images that have already been loaded in this session
const loadedImages = new Set<string>();
// Cache for already resolved local URLs to avoid repeated filesystem calls
const resolvedLocalUrls = new Map<string, string>();

type CachedImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  fallback?: React.ReactNode;
};

export function CachedImage({ src, className, fallback, ...props }: CachedImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(resolvedLocalUrls.get(src) || src || null);
  const [isLoaded, setIsLoaded] = useState(loadedImages.has(src));
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    if (!src) {
      setIsLoaded(false);
      setError(false);
      setCurrentSrc(null);
      return;
    }

    const loadImage = async () => {
      let finalSrc = src;
      
      // Check if we already have a resolved local URL for this src
      if (Capacitor.isNativePlatform()) {
        if (resolvedLocalUrls.has(src)) {
          finalSrc = resolvedLocalUrls.get(src)!;
        } else {
          try {
            const localUrl = await imagePersistence.getLocalUrl(src);
            if (localUrl) {
              finalSrc = localUrl;
              resolvedLocalUrls.set(src, localUrl);
            }
          } catch (e) {
            // Fallback to original src
          }
        }
      }

      if (!isMounted) return;

      // Update currentSrc if it's different from what we're showing
      if (finalSrc !== currentSrc) {
        setCurrentSrc(finalSrc);
      }

      // If already marked as loaded globally, just set local state
      // BUT only if we are showing the same URL that was loaded
      if (loadedImages.has(src) && finalSrc === currentSrc) {
        setIsLoaded(true);
        return;
      }

      const img = new Image();
      if (props.referrerPolicy) {
        img.referrerPolicy = props.referrerPolicy as ReferrerPolicy;
      }
      
      img.onload = () => {
        if (isMounted) {
          loadedImages.add(src);
          setIsLoaded(true);
          setError(false);
        }
      };
      
      img.onerror = () => {
        if (isMounted) {
          // If native cache failed, try the original URL as a last resort
          if (finalSrc !== src) {
            console.warn(`[IMAGE_CACHE] Local URL failed, falling back to remote: ${src}`);
            setCurrentSrc(src);
            const retryImg = new Image();
            if (props.referrerPolicy) retryImg.referrerPolicy = props.referrerPolicy as ReferrerPolicy;
            retryImg.onload = () => {
              if (isMounted) {
                loadedImages.add(src);
                setIsLoaded(true);
                setError(false);
              }
            };
            retryImg.onerror = () => {
              if (isMounted) {
                setError(true);
                setIsLoaded(false);
              }
            };
            retryImg.src = src;
          } else {
            setError(true);
            setIsLoaded(false);
          }
        }
      };
      
      img.src = finalSrc;
    };

    loadImage();
    return () => { isMounted = false; };
  }, [src]);

  if (error) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className={cn(
        className,
        "bg-gray-800 flex items-center justify-center text-gray-600"
      )}>
        <FileText className="w-1/3 h-1/3 opacity-20" />
      </div>
    );
  }

  return (
    <img
      key={src}
      src={currentSrc || undefined}
      draggable={false}
      className={cn(
        className,
        !isLoaded && "opacity-0",
        isLoaded && "opacity-100 transition-opacity duration-300"
      )}
      {...props}
      loading="lazy"
    />
  );
}
