import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { event_name, due_date, print_type } = body

    
    
    const apiKey = process.env.OPENAI_API_KEY
    
    if (apiKey) {
      // For Open Ai
    }

    
    await new Promise(r => setTimeout(r, 1500)) 

    let suggestion = ''
    if (print_type === 'screen_print') {
      suggestion = `Since you chose Screen Printing for "${event_name}", our team is currently separating your artwork into color layers. Expect your digital mockup within 24-48 hours. Tip: To meet your ${new Date(due_date).toLocaleDateString()} deadline, try to review the proof as soon as it arrives!`
    } else if (print_type === 'embroidery') {
      suggestion = `Embroidery selected for "${event_name}"! We are currently digitizing your design for our embroidery machines. Since this process takes slightly longer, keep an eye on your email for the stitch-out proof.`
    } else {
      suggestion = `"Based on your ${new Date(due_date).toLocaleDateString()} due date, everything is on track! Your digital proofs will be ready shortly. Make sure to have your final sizes ready once you approve the design.`
    }

    return NextResponse.json({ suggestion })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate suggestion' }, { status: 500 })
  }
}