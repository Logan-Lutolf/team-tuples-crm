

export default async function Home() {
  // switch to better auth
  // const user = await hexclaveServerApp.getUser();

  // get recommended schools, programs, contacts, etc. here

  return (
    <main>
      <div>
        {/* 
        {user ? <section>
          <h2>Sign in to access the blog</h2>
        </section> : 
        */}
        <section>
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">Main page</h1>
        </section>

      </div>
    </main>
  );
}
