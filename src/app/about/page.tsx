import { Container } from '@mui/material';
import nextPackage from 'next/package.json';
import reactPackage from 'react/package.json';
import AboutInfoComponent from '../../components/AboutInfoComponent';

export default function AboutPage() {
  const nextJsVersion = nextPackage.version;
  const reactVersion = reactPackage.version;

  return (
    <Container>
      <AboutInfoComponent nextJsVersion={nextJsVersion} reactVersion={reactVersion} />
    </Container>
  );
}

