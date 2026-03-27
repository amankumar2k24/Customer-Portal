CREATE POLICY "Customers can insert proofs for their own orders" ON public.proofs 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE public.orders.id = order_id 
    AND public.orders.customer_id = auth.uid()
  )
);