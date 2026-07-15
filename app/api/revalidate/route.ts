import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json()

    if (!path) {
      return NextResponse.json({ message: 'Path mancante' }, { status: 400 })
    }

    // Forza Next.js a distruggere la cache statica per questo specifico percorso
    revalidatePath(path)

    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}