import React, { useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { bool, node, string } from 'prop-types';
import ReactCrop from 'react-image-crop';

import Button from '../Button/Button';
import { ReactComponent as ImageIcon } from '../../../../icons/image.svg';

import './ImageUpload.scss';
import Image from '../Image/Image';

const ImageUpload = ({
  croppable,
  presetImage,
  label,
  useIcon = false,
}) => {
  const [crop, setCrop] = useState({ aspect: 1 / 1, width: 100, unit: '%' });
  const { register, setValue } = useFormContext();
  const previewRef = useRef(null);
  const inputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(presetImage);
  const watchImage = useWatch({ name: 'image' });

  useEffect(() => {
    register('image');
  }, []);

  useEffect(() => {
    if (previewImage) {
      setValue('image', previewImage);
    } else {
      setValue('image', undefined);
    }
  }, [previewImage]);

  useEffect(() => {
    if (!watchImage) {
      setPreviewImage(undefined);
    } else if (previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [watchImage]);

  const onChangeFunc = ({ target }) => {
    const files = target.files || [];
    const file = files[0];

    if (file) {
      const reader = new FileReader();

      reader.addEventListener('load', () => {
        if (reader.result) {
          const image = {
            imageName: file.name,
            source: reader.result,
          };

          setPreviewImage(image);
        }
      });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className="ImageUpload"
    >
      <input
        key="uploadInput"
        className="hide"
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/pjpeg"
        onChange={onChangeFunc}
      />
      {
        croppable
          ? (
            <ReactCrop
              crop={crop}
              onChange={(newCrop) => setCrop(newCrop)}
              src={previewImage ? previewImage.source : ''}
              onComplete={(completeCrop, percentageCrop) => {
                const updatedImage = previewImage;
                updatedImage.crop = percentageCrop;

                setPreviewImage(updatedImage);
              }}
            />
          )
          : (
            <Image
              ref={previewRef}
              onRemove={() => setPreviewImage(undefined)}
              className={`previewImage ${!previewImage ? 'hide' : ''}`}
              image={previewImage ? previewImage.source : ''}
              altText="Image preview"
            />
          )
      }
      <Button
        type="button"
        onClick={() => { inputRef.current.click(); }}
      >
        <ImageIcon />
        {!useIcon && (<span>{previewImage ? 'Change image' : label || 'Upload image'}</span>)}
      </Button>
    </div>
  );
};

export default React.memo(ImageUpload);

ImageUpload.propTypes = {
  useIcon: bool,
  presetImage: string,
  label: node,
  croppable: bool,
};

ImageUpload.defaultProps = {
  useIcon: false,
  presetImage: undefined,
  label: undefined,
  croppable: undefined,
};
