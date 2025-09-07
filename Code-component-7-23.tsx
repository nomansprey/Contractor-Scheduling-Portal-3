<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Job Scheduling Portal</title>
    <style>
      /* Prevent iframe scrolling issues */
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        overflow-x: hidden;
      }
      
      #root {
        height: 100%;
        min-height: 100vh;
      }
      
      /* Iframe-friendly styles */
      body.embedded {
        background: transparent;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
    
    <!-- Detect if running in iframe -->
    <script>
      if (window !== window.top) {
        document.body.classList.add('embedded');
      }
    </script>
  </body>
</html>