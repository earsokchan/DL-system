// src/components/Login.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

// Styled components
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f6f8fa;
`;

const LoginBox = styled.div`
  background: #fff;
  padding: 2.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  width: 100%;
  max-width: 350px;
`;

const Title = styled.h2`
  margin-bottom: 1.5rem;
  text-align: center;
  color: #22223b;
  font-weight: 600;
`;

const ErrorMsg = styled.p`
  color: #e63946;
  background: #ffe5e9;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.97rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const Label = styled.label`
  font-size: 1rem;
  color: #4a4e69;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 0.6rem 0.9rem;
  border: 1px solid #c9c9c9;
  border-radius: 6px;
  font-size: 1rem;
  background: #f8f9fa;
  transition: border 0.2s;
  &:focus {
    border-color: #4f8cff;
    outline: none;
    background: #fff;
  }
`;

const Button = styled.button`
  padding: 0.7rem 0;
  background: #4f8cff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1.08rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.2s;
  &:hover {
    background: #2563eb;
  }
`;

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check for empty fields
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    // Check credentials against environment variables
    if (
      username.trim() === process.env.REACT_APP_ADMIN_USERNAME && 
      password === process.env.REACT_APP_ADMIN_PASSWORD
    ) {
      // Store authentication state
      localStorage.setItem('isAuthenticated', 'true');
      // Redirect to home page after successful login
      navigate('/');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <Container>
      <LoginBox>
        <Title>Login</Title>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="username">Username:</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="password">Password:</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </FormGroup>
          <Button type="submit">
            Login
          </Button>
        </Form>
      </LoginBox>
    </Container>
  );
};

export default Login;