FROM node:18

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Set environment variable to bypass compile failures during postinstall
ENV NODE_LLAMA_CPP_POSTINSTALL=ignoreFailedBuild

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Expose port (Hugging Face Spaces exposes 7860)
ENV PORT=7860
EXPOSE 7860

# Create models directory and download Dolphin 3B model
RUN mkdir -p models && \
    curl -L -o models/Dolphin3.0-Llama3.2-3B-Q5_K_M.gguf \
    "https://huggingface.co/Bartowski/Dolphin3.0-Llama3.2-3B-GGUF/resolve/main/Dolphin3.0-Llama3.2-3B-Q5_K_M.gguf"

# Set permissions
RUN chmod -R 777 /app

CMD ["node", "server.mjs"]
