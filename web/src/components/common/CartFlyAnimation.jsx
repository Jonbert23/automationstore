import { useEffect, useState } from 'react';
import useUIStore from '../../hooks/useUIStore';

const CartFlyAnimation = () => {
  const { animations, removeAnimation } = useUIStore();
  const [targetRect, setTargetRect] = useState(null);

  // Update target position on mount and resize
  useEffect(() => {
    const updateTarget = () => {
      const cartIcon = document.getElementById('cart-icon-container');
      if (cartIcon) {
        setTargetRect(cartIcon.getBoundingClientRect());
      }
    };

    updateTarget();
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget); // Update on scroll too

    return () => {
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
      {animations.map((anim) => (
        <FlyingImage 
          key={anim.id} 
          animation={anim} 
          targetRect={targetRect} 
          onComplete={() => removeAnimation(anim.id)} 
        />
      ))}
    </div>
  );
};

const FlyingImage = ({ animation, targetRect, onComplete }) => {
  const { startRect, imageSrc } = animation;
  const [style, setStyle] = useState({
    position: 'absolute',
    left: startRect.left,
    top: startRect.top,
    width: startRect.width,
    height: startRect.height,
    opacity: 1,
    transform: 'scale(1)',
    transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
    objectFit: 'contain',
    borderRadius: '8px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
    zIndex: 9999,
  });

  useEffect(() => {
    if (!targetRect) return;

    // Small delay to ensure initial render happens at start position
    const timer = setTimeout(() => {
      setStyle((prev) => ({
        ...prev,
        left: targetRect.left + (targetRect.width / 2) - (20), // Center on icon
        top: targetRect.top + (targetRect.height / 2) - (20),
        width: '40px', // Shrink to icon size
        height: '40px',
        opacity: 0.5, // Fade out slightly at the end
        transform: 'scale(0.5)', // Shrink effect
      }));
    }, 50);

    // Cleanup after animation duration
    const cleanup = setTimeout(() => {
      onComplete();
      
      // Optional: Trigger a shake effect on the cart icon
      const cartIcon = document.getElementById('cart-icon-container');
      if (cartIcon) {
        cartIcon.style.transform = 'scale(1.2)';
        setTimeout(() => {
          cartIcon.style.transform = 'scale(1)';
        }, 200);
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      clearTimeout(cleanup);
    };
  }, [targetRect, onComplete]);

  return <img src={imageSrc} style={style} alt="" />;
};

export default CartFlyAnimation;
