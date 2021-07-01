import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  Image,
  Link,
} from '@chakra-ui/react';

interface ModalViewImageProps {
  isOpen: boolean;
  onClose: () => void;
  imgUrl: string;
}

export function ModalViewImage({
  isOpen,
  onClose,
  imgUrl,
}: ModalViewImageProps): JSX.Element {
  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <ModalOverlay />

      <ModalContent>
        <ModalBody p={0}>
          <Image src={imgUrl} />
        </ModalBody>
        <ModalFooter
          background="gray.800"
          justifyContent="flex-start"
          py="0.5"
          px="10px"
          borderBottomRadius="6px"
        >
          <Link target="blank" href={imgUrl} rel="noopener">
            Abrir original
          </Link>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
