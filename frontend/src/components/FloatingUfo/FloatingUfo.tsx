import Image from 'next/image';
import ufoImage from '../../img/ufo.png';
import './FloatingUfo.css';

export const FloatingUfo = () => {
  return (
    <div className="floating-ufo">
      <Image src={ufoImage} alt="UFO" unoptimized />
    </div>
  );
};
