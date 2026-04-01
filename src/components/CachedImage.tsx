import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { imagePersistence } from '../utils/imagePersistence';
import { Capacitor } from '@capacitor/core';
import { FileText } from 'lucide-react';

// Global set to track images that have already been loaded in this session
const loadedImages = new Set<string>();

type CachedImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  fallback?: React.ReactNode;
};

export function CachedImage({ src, className, fallback, ...props }: CachedImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(src || null);
  const [isLoaded, setIsLoaded] = useState(loadedImages.has(src));
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // If src is empty, do nothing
    if (!src) {
      setIsLoaded(false);
      setError(false);
      setCurrentSrc(null);
      return;
    }

    const loadImage = async () => {
      let finalSrc = src;
      
      if (Capacitor.isNativePlatform()) {
        try {
          const localUrl = await imagePersistence.getLocalUrl(src);
          if (localUrl) {
            finalSrc = localUrl;
          }
        } catch (e) {
          // Fallback to original src
        }
      }

      if (!isMounted) return;

      // If the finalSrc is different from what we're currently showing, update it
      if (finalSrc !== currentSrc) {
        setCurrentSrc(finalSrc);
      }

      // If already marked as loaded globally, just set local state
      if (loadedImages.has(src)) {
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
          // If native cache failed, try the original URL as a last resort if we haven't already
          if (finalSrc !== src) {
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
