import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '../components/modal';

describe('Modal', () => {
  it('does not render when closed', () => {
    render(
      <Modal isOpen={false}>
        <ModalHeader>
          <ModalTitle>Hidden Modal</ModalTitle>
        </ModalHeader>
      </Modal>
    );

    expect(screen.queryByText('Hidden Modal')).toBeNull();
  });

  it('renders when open', () => {
    render(
      <Modal isOpen ariaLabel="Example modal">
        <ModalHeader>
          <ModalTitle>Example Modal</ModalTitle>
        </ModalHeader>
        <ModalBody>Content goes here</ModalBody>
        <ModalFooter />
      </Modal>
    );

    expect(screen.getByText('Example Modal')).toBeInTheDocument();
  });
});
