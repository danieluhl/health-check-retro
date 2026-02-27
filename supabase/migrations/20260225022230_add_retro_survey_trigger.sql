-- Create a function to insert a survey when a new retro is created
CREATE OR REPLACE FUNCTION public.handle_new_retro()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.surveys (retro_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the retro table
CREATE TRIGGER on_retro_created
  AFTER INSERT ON public.retros
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_retro();
